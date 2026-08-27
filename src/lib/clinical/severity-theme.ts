/**
 * Shared severity-band visual language.
 * Extracted from the caregiver-facing ZaritResultsView so the clinician
 * dashboard renders the exact same band -> color mapping instead of a
 * second, driftable copy. Any change to how "red" looks updates both views.
 */

import type { SeverityBand } from '@/lib/zarit-scale';
import type { CareGapEvaluationResult } from './care-gap-engine';

export interface SeverityConfig {
  color: string;
  bgColor: string;
  badgeBg: string;
  desc: { en: string; hi: string; mr: string };
}

export const SEVERITY_CONFIGS: Record<SeverityBand, SeverityConfig> = {
  normal: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-500 text-white',
    desc: {
      en: 'Caregiver capacity is currently stable. Preventive self-care and routine ergonomic training recommended.',
      hi: 'देखभालकर्ता की स्थिति स्थिर है। नियमित स्व-देखभाल और बचाव के उपाय जारी रखें।',
      mr: 'काळजीवाहू व्यक्तीची स्थिती स्थिर आहे. नियमित स्वतःची काळजी आणि प्रतिबंधात्मक उपाय चालू ठेवा.'
    }
  },
  amber: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-500 text-white',
    desc: {
      en: 'Moderate fatigue and emerging role strain detected. Recommended to schedule routine respite and divide duties.',
      hi: 'मध्यम स्तर का तनाव व थकान दर्ज हुई है। कार्यों का बंटवारा करने व साप्ताहिक विश्राम लेने की सलाह दी जाती है।',
      mr: 'मध्यम स्वरूपाचा ताण जाणवत आहे. कामाची विभागणी करा आणि नियमित विश्रांतीचे नियोजन करा.'
    }
  },
  red: {
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-500 text-white',
    desc: {
      en: 'High caregiver strain exceeding safe burnout thresholds. Immediate task relief and clinical psychological consult advised.',
      hi: 'गंभीर स्तर का तनाव! बर्नआउट का अत्यधिक जोखिम। तुरंत मनोवैज्ञानिक परामर्श और सहायता प्राप्त करें।',
      mr: 'अतिशय गंभीर ताण आणि थकवा! तात्काळ मानसोपचारतज्ज्ञांचा सल्ला आणि मदत घेणे आवश्यक आहे.'
    }
  },
  critical_red: {
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800',
    badgeBg: 'bg-red-600 text-white animate-pulse',
    desc: {
      en: 'Critical caregiver exhaustion and possible collapse risk. Urgent respite support and care team rotation should be arranged.',
      hi: 'अति-गंभीर आपातकालीन स्थिति! तुरंत आपातकालीन विश्राम और परिवार के अन्य सदस्यों की भागीदारी अनिवार्य है।',
      mr: 'अति-गंभीर आणीबाणीची स्थिती! तात्काळ मदत आणि रुग्णाची काळजी घेणाऱ्या व्यक्तीची अदलाबदल आवश्यक.'
    }
  }
};

/* ------------------------------------------------------------------ *
 * Unifying the three parallel risk vocabularies.
 *
 * The product has three independent risk readings that can disagree on the
 * same dyad at the same moment:
 *   - Zarit severityBand:        normal / amber / red / critical_red
 *   - CareGapEngine severity:    sustainable / mild_deficit / high_deficit / critical_overload
 *   - CareGapEngine burnout:     low / moderate / high / critical
 *   - trajectory riskBand:       stable / deteriorating / critical / lost-to-follow-up / insufficient-data
 *
 * A dyad could read "sustainable" on the care-gap engine's hours heuristic
 * while the validated ZBI instrument reads "critical_red" for the same
 * caregiver, with no rule for which one a clinician should trust. This
 * resolver expresses that trust order explicitly: severityBand (from the
 * validated psychometric instrument) is the floor. The hours heuristic is
 * real signal — it can escalate attention — but it is not a validated
 * instrument, so it may raise the unified band by at most one step above
 * where ZBI put it, and it may never single-handedly claim the top band.
 * ------------------------------------------------------------------ */
const SEVERITY_ORDER: SeverityBand[] = ['normal', 'amber', 'red', 'critical_red'];
const CARE_GAP_SEVERITY_ORDER: CareGapEvaluationResult['careGapSeverity'][] = [
  'sustainable',
  'mild_deficit',
  'high_deficit',
  'critical_overload'
];

export interface UnifiedRiskResult {
  band: SeverityBand;
  /** Which signal ultimately determined the returned band. */
  source: 'zarit' | 'zarit-elevated-by-care-gap' | 'care-gap-only' | 'none';
}

export function resolveUnifiedRiskBand(
  zaritBand: SeverityBand | null | undefined,
  careGapSeverity: CareGapEvaluationResult['careGapSeverity'] | null | undefined
): UnifiedRiskResult {
  const careGapIndex =
    careGapSeverity != null ? CARE_GAP_SEVERITY_ORDER.indexOf(careGapSeverity) : -1;

  if (zaritBand != null) {
    const zaritIndex = SEVERITY_ORDER.indexOf(zaritBand);
    if (careGapIndex > zaritIndex) {
      // Escalate by exactly one step, never straight to the ZBI reading's own
      // top band via an unvalidated heuristic.
      const escalatedIndex = Math.min(zaritIndex + 1, SEVERITY_ORDER.length - 1);
      return { band: SEVERITY_ORDER[escalatedIndex], source: 'zarit-elevated-by-care-gap' };
    }
    return { band: zaritBand, source: 'zarit' };
  }

  if (careGapIndex >= 0) {
    // No validated instrument on file — cap the heuristic-only reading below
    // the top band, which is reserved for a validated crisis signal (a ZBI
    // red flag or critical_red score).
    const cappedIndex = Math.min(careGapIndex, SEVERITY_ORDER.length - 2);
    return { band: SEVERITY_ORDER[cappedIndex], source: 'care-gap-only' };
  }

  return { band: 'normal', source: 'none' };
}
