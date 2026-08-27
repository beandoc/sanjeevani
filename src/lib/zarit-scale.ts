/**
 * Standardized Zarit Caregiver Burden Scale (ZBI) Clinical Psychometric Engine
 * Supporting ZBI-22 (Full), ZBI-12 (Bédard Short Form), and ZBI-4 (Rapid Triage)
 * Multilingual Support: English (en), Hindi (hi), Marathi (mr)
 *
 * The summed ZBI score follows published instrument conventions. The red-flag
 * reasons, domain-capacity views, crisis flag, and action prompts are
 * Sanjeevani local triage overlays and should not be presented as validated
 * ZBI subscales.
 */

import { CLINICAL_PROVENANCE, ClinicalProvenance } from './clinical/provenance';

export type ZbiTier = 'ZBI22' | 'ZBI12' | 'ZBI4';
export type SeverityBand = 'normal' | 'amber' | 'red' | 'critical_red';
export type ZbiFactor = 'personal_strain' | 'role_strain' | 'financial_strain' | 'competency' | 'guilt' | 'global_burden';

export interface ZbiItem {
  id: string;
  number: number;
  factor: ZbiFactor;
  text: {
    en: string;
    hi: string;
    mr: string;
  };
  domainWeights: {
    psychosocial?: number;
    resource?: number;
    physical?: number;
    safety?: number;
    cognitive_behavioral?: number;
    medical?: number;
  };
  isRedFlagTrigger?: boolean;
  redFlagThreshold?: number; // Score >= threshold triggers crisis alert
  redFlagReason?: string;
}

export const LIKERT_OPTIONS = [
  { value: 0, label: { en: 'Never', hi: 'कभी नहीं', mr: 'कधीही नाही' }, description: { en: '0 times', hi: '0 बार', mr: '0 वेळा' } },
  { value: 1, label: { en: 'Rarely', hi: 'कभी-कभार', mr: 'क्वचितच' }, description: { en: 'Seldom', hi: 'दुर्लभ', mr: 'क्वचित' } },
  { value: 2, label: { en: 'Sometimes', hi: 'कभी-कभी', mr: 'कधीकधी' }, description: { en: 'Occasional', hi: 'यदा-कदा', mr: 'काही वेळा' } },
  { value: 3, label: { en: 'Quite Frequently', hi: 'अक्सर', mr: 'वारंवार' }, description: { en: 'Often', hi: 'प्रायः', mr: 'नेहमीसारखे' } },
  { value: 4, label: { en: 'Nearly Always', hi: 'लगभग हमेशा', mr: 'जवळजवळ नेहमी' }, description: { en: 'Constant', hi: 'सतत', mr: 'नेहमीच' } }
];

export const ZBI_22_ITEMS: ZbiItem[] = [
  {
    id: 'zbi_1',
    number: 1,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel that your relative asks for more help than he/she needs?',
      hi: 'क्या आपको लगता है कि आपका परिजन जितनी जरूरत है उससे ज्यादा मदद मांगता है?',
      mr: 'तुम्हाला असे वाटते का की तुमचे नातेवाईक गरजेपेक्षा जास्त मदत मागतात?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_2',
    number: 2,
    factor: 'role_strain',
    text: {
      en: "Do you feel that because of the time you spend with your relative that you don't have enough time for yourself?",
      hi: 'क्या आपको लगता है कि परिजन के साथ समय बिताने के कारण आपके पास अपने लिए पर्याप्त समय नहीं बचता?',
      mr: 'नातेवाईकांसोबत वेळ घालवल्यामुळे तुम्हाला स्वतःसाठी पुरेसा वेळ मिळत नाही असे वाटते का?'
    },
    domainWeights: { resource: 0.6, psychosocial: 0.4 }
  },
  {
    id: 'zbi_3',
    number: 3,
    factor: 'role_strain',
    text: {
      en: 'Do you feel stressed between caring for your relative and trying to meet other responsibilities for your family or work?',
      hi: 'क्या आप परिजन की देखभाल करने और परिवार या काम की अन्य जिम्मेदारियां पूरी करने के बीच तनाव महसूस करते हैं?',
      mr: 'नातेवाईकांची काळजी घेणे आणि कुटुंब किंवा कामाच्या इतर जबाबदाऱ्या सांभाळताना तुम्हाला तणाव जाणवतो का?'
    },
    domainWeights: { resource: 0.5, psychosocial: 0.5 }
  },
  {
    id: 'zbi_4',
    number: 4,
    factor: 'personal_strain',
    text: {
      en: "Do you feel embarrassed over your relative's behavior?",
      hi: 'क्या आपको अपने परिजन के व्यवहार पर शर्मिंदगी महसूस होती है?',
      mr: 'तुम्हाला तुमच्या नातेवाईकांच्या वागण्याची लाज किंवा संकोच वाटतो का?'
    },
    domainWeights: { cognitive_behavioral: 0.6, psychosocial: 0.4 }
  },
  {
    id: 'zbi_5',
    number: 5,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel angry when you are around your relative?',
      hi: 'क्या जब आप अपने परिजन के पास होते हैं तो आपको गुस्सा या चिड़चिड़ाहट महसूस होती है?',
      mr: 'नातेवाईकांजवळ असताना तुम्हाला राग किंवा चीड येते का?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_6',
    number: 6,
    factor: 'role_strain',
    text: {
      en: 'Do you feel that your relative currently affects your relationship with other family members or friends in a negative way?',
      hi: 'क्या आपको लगता है कि परिजन की स्थिति आपके अन्य पारिवारिक या सामाजिक रिश्तों पर बुरा असर डाल रही है?',
      mr: 'नातेवाईकांच्या परिस्थितीमुळे इतर कुटुंबियांशी किंवा मित्रांशी संबंध बिघडत आहेत असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, resource: 0.3 }
  },
  {
    id: 'zbi_7',
    number: 7,
    factor: 'personal_strain',
    text: {
      en: 'Are you afraid about what the future holds for your relative?',
      hi: 'क्या आप अपने परिजन के भविष्य को लेकर डरे या चिंतित रहते हैं?',
      mr: 'तुम्हाला तुमच्या नातेवाईकांच्या भविष्याबद्दल भीती किंवा चिंता वाटते का?'
    },
    domainWeights: { psychosocial: 0.6, cognitive_behavioral: 0.4 },
    isRedFlagTrigger: true,
    redFlagThreshold: 4,
    redFlagReason: 'Severe Future Anxiety & Panic Strain'
  },
  {
    id: 'zbi_8',
    number: 8,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel that your relative is dependent upon you?',
      hi: 'क्या आपको लगता है कि आपका परिजन पूरी तरह आप पर ही निर्भर है?',
      mr: 'तुमचे नातेवाईक पूर्णपणे तुमच्यावर अवलंबून आहेत असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, physical: 0.3 },
    isRedFlagTrigger: true,
    redFlagThreshold: 4,
    redFlagReason: 'Absolute Perceived Dependency / Sole Caregiver Strain'
  },
  {
    id: 'zbi_9',
    number: 9,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel strained when you are around your relative?',
      hi: 'क्या परिजन के पास रहने पर आप लगातार मानसिक तनाव या दबाव महसूस करते हैं?',
      mr: 'नातेवाईकांजवळ असताना तुम्हाला मानसिक ताण जाणवतो का?'
    },
    domainWeights: { psychosocial: 1.0 },
    isRedFlagTrigger: true,
    redFlagThreshold: 4,
    redFlagReason: 'Acute Psychological Exhaustion'
  },
  {
    id: 'zbi_10',
    number: 10,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel your health has suffered because of your involvement with your relative?',
      hi: 'क्या आपको लगता है कि परिजन की देखभाल के चक्कर में आपका खुद का स्वास्थ्य खराब हो रहा है?',
      mr: 'नातेवाईकांची काळजी घेताना तुमचे स्वतःचे आरोग्य खालावत आहे असे वाटते का?'
    },
    domainWeights: { physical: 0.8, medical: 0.2 },
    isRedFlagTrigger: true,
    redFlagThreshold: 3,
    redFlagReason: 'Caregiver Physical Health Breakdown'
  },
  {
    id: 'zbi_11',
    number: 11,
    factor: 'role_strain',
    text: {
      en: "Do you feel that you don't have as much privacy as you would like because of your relative?",
      hi: 'क्या आपको लगता है कि परिजन की देखभाल की वजह से आपको निजी जिंदगी/एकांत नहीं मिल पाता?',
      mr: 'नातेवाईकांमुळे तुम्हाला स्वतःची प्रायव्हसी किंवा एकांत मिळत नाही असे वाटते का?'
    },
    domainWeights: { resource: 0.6, psychosocial: 0.4 }
  },
  {
    id: 'zbi_12',
    number: 12,
    factor: 'role_strain',
    text: {
      en: 'Do you feel that your social life has suffered because you are caring for your relative?',
      hi: 'क्या परिजन की देखभाल के कारण आपका सामाजिक जीवन पूरी तरह ठप हो गया है?',
      mr: 'काळजी घेण्यामुळे तुमचे सामाजिक जीवन किंवा नातेसंबंध प्रभावित झाले आहेत का?'
    },
    domainWeights: { resource: 0.7, psychosocial: 0.3 }
  },
  {
    id: 'zbi_13',
    number: 13,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel uncomfortable about having your friends over because of your relative?',
      hi: 'क्या परिजन के कारण आप दोस्तों या मेहमानों को घर बुलाने में असहज महसूस करते हैं?',
      mr: 'नातेवाईकांमुळे मित्रांना किंवा पाहुण्यांना घरी बोलवण्यास तुम्हाला संकोच वाटतो का?'
    },
    domainWeights: { psychosocial: 0.8, cognitive_behavioral: 0.2 }
  },
  {
    id: 'zbi_14',
    number: 14,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel that your relative seems to expect you to take care of him/her as if you were the only one he/she could depend on?',
      hi: 'क्या आपका परिजन आपसे ऐसी उम्मीद रखता है जैसे इस दुनिया में केवल आप ही उसके एकमात्र सहारे हैं?',
      mr: 'नातेवाईक केवळ तुमच्यावरच विसंबून राहावे अशी अपेक्षा ठेवतात असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, resource: 0.3 },
    isRedFlagTrigger: true,
    redFlagThreshold: 4,
    redFlagReason: 'Extreme Isolation & Sole Dependency Burden'
  },
  {
    id: 'zbi_15',
    number: 15,
    factor: 'financial_strain',
    text: {
      en: "Do you feel that you don't have enough money to care for your relative in addition to the rest of your expenses?",
      hi: 'क्या आपको लगता है कि अपने अन्य खर्चों के अलावा परिजन की देखभाल के लिए आपके पास पैसों की तंगी है?',
      mr: 'इतर खर्चांव्यतिरिक्त नातेवाईकांची काळजी घेण्यासाठी पुरेसे पैसे नाहीत असे वाटते का?'
    },
    domainWeights: { resource: 1.0 },
    isRedFlagTrigger: true,
    redFlagThreshold: 4,
    redFlagReason: 'Severe Financial Toxicity in Caregiving'
  },
  {
    id: 'zbi_16',
    number: 16,
    factor: 'competency',
    text: {
      en: 'Do you feel that you will be unable to take care of your relative much longer?',
      hi: 'क्या आपको लगता है कि आप ज्यादा लंबे समय तक इस तरह देखभाल जारी नहीं रख पाएंगे?',
      mr: 'तुम्ही फार काळ नातेवाईकांची काळजी घेऊ शकणार नाही असे तुम्हाला वाटते का?'
    },
    domainWeights: { physical: 0.5, psychosocial: 0.5 },
    isRedFlagTrigger: true,
    redFlagThreshold: 3,
    redFlagReason: 'Caregiver Imminent Resignation / Burnout Threshold'
  },
  {
    id: 'zbi_17',
    number: 17,
    factor: 'personal_strain',
    text: {
      en: 'Do you feel you have lost control of your life since your relative’s illness?',
      hi: 'क्या आपको लगता है कि परिजन की बीमारी के बाद से आपकी जिंदगी पर आपका कोई नियंत्रण नहीं रहा?',
      mr: 'नातेवाईकांच्या आजारपणानंतर तुमचे तुमच्या आयुष्यावरील नियंत्रण सुटले आहे असे वाटते का?'
    },
    domainWeights: { psychosocial: 0.8, cognitive_behavioral: 0.2 },
    isRedFlagTrigger: true,
    redFlagThreshold: 3,
    redFlagReason: 'Loss of Personal Autonomy / Clinical Hopelessness'
  },
  {
    id: 'zbi_18',
    number: 18,
    factor: 'competency',
    text: {
      en: 'Do you wish you could leave the care of your relative to someone else?',
      hi: 'क्या आपका मन करता है कि कोई और इस देखभाल की जिम्मेदारी संभाल ले और आप इससे मुक्त हो सकें?',
      mr: 'नातेवाईकांची काळजी घेण्याची जबाबदारी दुसऱ्या कोणावर तरी सोपवावी असे तुम्हाला वाटते का?'
    },
    domainWeights: { psychosocial: 0.7, resource: 0.3 }
  },
  {
    id: 'zbi_19',
    number: 19,
    factor: 'competency',
    text: {
      en: 'Do you feel uncertain about what to do about your relative?',
      hi: 'क्या आप इस बात को लेकर असमंजस में रहते हैं कि अपने परिजन के लिए क्या करना सही है?',
      mr: 'नातेवाईकांसाठी काय करावे याबद्दल तुम्हाला अनिश्चितता वाटते का?'
    },
    domainWeights: { medical: 0.5, cognitive_behavioral: 0.5 }
  },
  {
    id: 'zbi_20',
    number: 20,
    factor: 'guilt',
    text: {
      en: 'Do you feel you should be doing more for your relative?',
      hi: 'क्या आपको लगता है कि आपको अपने परिजन के लिए और अधिक करना चाहिए?',
      mr: 'तुम्हाला असे वाटते का की तुम्ही नातेवाईकांसाठी आणखी जास्त करायला हवे?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_21',
    number: 21,
    factor: 'guilt',
    text: {
      en: 'Do you feel you could do a better job in caring for your relative?',
      hi: 'क्या आपको लगता है कि आप अपने परिजन की देखभाल इससे बेहतर तरीके से कर सकते थे?',
      mr: 'तुम्ही नातेवाईकांची अधिक चांगल्या पद्धतीने काळजी घेऊ शकला असता असे वाटते का?'
    },
    domainWeights: { psychosocial: 1.0 }
  },
  {
    id: 'zbi_22',
    number: 22,
    factor: 'global_burden',
    text: {
      en: 'Overall, how burdened do you feel in caring for your relative?',
      hi: 'कुल मिलाकर, अपने परिजन की देखभाल करने में आप कितना भारी बोझ (बोझिलता) महसूस करते हैं?',
      mr: 'एकंदरीत, नातेवाईकांची काळजी घेताना तुम्हाला किती ताण किंवा ओझे वाटते?'
    },
    domainWeights: { psychosocial: 0.7, physical: 0.3 },
    isRedFlagTrigger: true,
    redFlagThreshold: 3,
    redFlagReason: 'Severe Global Acute Caregiver Overload'
  }
];

export const ZBI_12_ITEM_IDS = ['zbi_1', 'zbi_2', 'zbi_3', 'zbi_7', 'zbi_8', 'zbi_9', 'zbi_11', 'zbi_12', 'zbi_13', 'zbi_14', 'zbi_15', 'zbi_22'];
export const ZBI_4_ITEM_IDS = ['zbi_1', 'zbi_7', 'zbi_8', 'zbi_14'];

/**
 * Recommended reassessment cadence per tier, in days. Nothing in the product
 * previously prompted a retake, so `computeTrajectory` (trajectory.ts) almost
 * never saw the 3+ observations spanning 3+ weeks it needs to report a trend.
 *
 * ZBI-4 is a 4-item rapid triage instrument, cheap enough to retake often; a
 * 14-30 day window (midpoint used here) also matches the ~21-day minimum
 * observation span the trajectory engine requires before it will fit a slope.
 * ZBI-22/12 are longer full instruments better suited to a quarterly cadence,
 * matching the trajectory engine's own 90-day staleness threshold.
 */
export const REASSESSMENT_CADENCE_DAYS: Record<ZbiTier, number> = {
  ZBI4: 21,
  ZBI12: 90,
  ZBI22: 90
};

export function isReassessmentDue(lastAssessment: { tier: ZbiTier; completedAt: string } | null | undefined, now: Date = new Date()): boolean {
  if (!lastAssessment) return true;
  const completedAt = new Date(lastAssessment.completedAt).getTime();
  if (isNaN(completedAt)) return true;
  const daysSince = (now.getTime() - completedAt) / (24 * 60 * 60 * 1000);
  return daysSince >= REASSESSMENT_CADENCE_DAYS[lastAssessment.tier];
}

export interface FactorDetail {
  title: { en: string; hi: string; mr: string };
  rawScore: number;
  maxScore: number;
  percentage: number | null; // null if unmeasured in this tier
  isMeasured: boolean;
  clinicalNote: { en: string; hi: string; mr: string };
}

export interface CaregiverPrescription {
  id: string;
  category: 'Respite & Relief' | 'Psychological Support' | 'Skill Training' | 'Resource Assistance';
  title: { en: string; hi: string; mr: string };
  action: { en: string; hi: string; mr: string };
  recommendedLink?: string;
  linkText?: { en: string; hi: string; mr: string };
  urgency: 'routine' | 'priority' | 'urgent';
}

export interface ZaritEvaluationResult {
  tier: ZbiTier;
  totalScore: number;
  maxScore: number;
  normalizedPercentage: number;
  classification: { en: string; hi: string; mr: string };
  severityBand: SeverityBand;
  factors: Record<ZbiFactor, FactorDetail>;
  domainCapacities: {
    psychosocial: number | null;
    resource: number | null;
    physical: number | null;
    safety: number | null;
    cognitive_behavioral: number | null;
    medical: number | null;
  };
  redFlags: string[];
  isCrisisTriggered: boolean;
  provenance?: {
    score: ClinicalProvenance;
    triageOverlay: ClinicalProvenance;
  };
  prescriptions: CaregiverPrescription[];
  completedAt: string;
}

export function getItemsForTier(tier: ZbiTier): ZbiItem[] {
  if (tier === 'ZBI12') {
    return ZBI_22_ITEMS.filter((item) => ZBI_12_ITEM_IDS.includes(item.id));
  }
  if (tier === 'ZBI4') {
    return ZBI_22_ITEMS.filter((item) => ZBI_4_ITEM_IDS.includes(item.id));
  }
  return ZBI_22_ITEMS;
}

export function calculateZaritScore(
  responses: Record<string, number>,
  tier: ZbiTier
): ZaritEvaluationResult {
  const items = getItemsForTier(tier);
  const maxScore = tier === 'ZBI22' ? 88 : tier === 'ZBI12' ? 48 : 16;
  
  let totalScore = 0;
  const factorAccumulators: Record<ZbiFactor, { score: number; max: number }> = {
    personal_strain: { score: 0, max: 0 },
    role_strain: { score: 0, max: 0 },
    financial_strain: { score: 0, max: 0 },
    competency: { score: 0, max: 0 },
    guilt: { score: 0, max: 0 },
    global_burden: { score: 0, max: 0 }
  };

  const domainLoads: Record<string, number> = {
    psychosocial: 0,
    resource: 0,
    physical: 0,
    safety: 0,
    cognitive_behavioral: 0,
    medical: 0
  };
  const domainWeightsTotal: Record<string, number> = {
    psychosocial: 0,
    resource: 0,
    physical: 0,
    safety: 0,
    cognitive_behavioral: 0,
    medical: 0
  };

  const redFlags: string[] = [];

  for (const item of items) {
    const val = Math.max(0, Math.min(responses[item.id] ?? 0, 4));
    totalScore += val;

    factorAccumulators[item.factor].score += val;
    factorAccumulators[item.factor].max += 4;

    for (const [dom, weight] of Object.entries(item.domainWeights)) {
      if (weight) {
        domainLoads[dom] += (val / 4.0) * 100 * weight;
        domainWeightsTotal[dom] += weight;
      }
    }

    if (item.isRedFlagTrigger && item.redFlagThreshold && val >= item.redFlagThreshold) {
      redFlags.push(`${item.redFlagReason} (Q${item.number}: ${val}/4)`);
    }
  }

  const normalizedPercentage = Math.round((totalScore / maxScore) * 100);

  // Determine Severity and Classification per tier
  let severityBand: SeverityBand = 'normal';
  let classification = {
    en: 'Little to No Burden',
    hi: 'मामूली या न के बराबर तनाव',
    mr: 'फार कमी किंवा नगण्य ताण'
  };

  if (tier === 'ZBI22') {
    if (totalScore <= 20) {
      severityBand = 'normal';
      classification = { en: 'Little to No Burden', hi: 'मामूली या न के बराबर तनाव', mr: 'फार कमी किंवा नगण्य ताण' };
    } else if (totalScore <= 40) {
      severityBand = 'amber';
      classification = { en: 'Mild to Moderate Burden', hi: 'हल्का से मध्यम तनाव', mr: 'मध्यम स्वरूपाचा ताण' };
    } else if (totalScore <= 60) {
      severityBand = 'red';
      classification = { en: 'Moderate to Severe Burden', hi: 'मध्यम से गंभीर तनाव', mr: 'गंभीर स्वरूपाचा ताण' };
    } else {
      severityBand = 'critical_red';
      classification = { en: 'Severe Burden / Burnout', hi: 'अत्यधिक गंभीर बोझ और थकान', mr: 'अति-गंभीर थकवा आणि ताण' };
    }
  } else if (tier === 'ZBI12') {
    if (totalScore < 12) {
      severityBand = 'normal';
      classification = { en: 'Low Burden (Screening Negative)', hi: 'कम तनाव', mr: 'कमी ताण' };
    } else if (totalScore < 17) {
      severityBand = 'amber';
      classification = { en: 'Moderate Burden (Watchlist)', hi: 'मध्यम तनाव', mr: 'मध्यम ताण' };
    } else if (totalScore < 28) {
      severityBand = 'red';
      classification = { en: 'High Burden (Burnout Risk Exceeded)', hi: 'उच्च तनाव (बर्नआउट जोखिम)', mr: 'उच्च ताण (थकवा धोका)' };
    } else {
      severityBand = 'critical_red';
      classification = { en: 'Critical Burden (Crisis Imminent)', hi: 'अत्यधिक गंभीर संकट स्तर', mr: 'अति-गंभीर संकट पातळी' };
    }
  } else {
    // ZBI-4 Rapid Triage Instrument
    if (totalScore <= 5) {
      severityBand = 'normal';
      classification = { en: 'Screening Negative', hi: 'स्क्रीनिंग सामान्य', mr: 'स्क्रीनिंग सामान्य' };
    } else if (totalScore <= 9) {
      severityBand = 'amber';
      classification = { en: 'Moderate Acute Strain', hi: 'मध्यम तीव्र तनाव', mr: 'मध्यम तीव्र ताण' };
    } else if (totalScore <= 11) {
      severityBand = 'red';
      classification = { en: 'High Acute Fatigue (Full ZBI Recommended)', hi: 'उच्च थकान (पूर्ण जांच आवश्यक)', mr: 'उच्च थकवा (पूर्ण तपासणी आवश्यक)' };
    } else {
      severityBand = 'critical_red';
      classification = { en: 'Critical Triage Escalation (Immediate Relief Required)', hi: 'गंभीर संकट स्तर (तत्काल राहत आवश्यक)', mr: 'गंभीर संकट पातळी (तातडीने मदत आवश्यक)' };
    }
  }

  // Factor details (guarding against unmeasured factors in short forms)
  const factorTitles: Record<ZbiFactor, { en: string; hi: string; mr: string }> = {
    personal_strain: { en: 'Personal Strain', hi: 'व्यक्तिगत तनाव', mr: 'वैयक्तिक ताण' },
    role_strain: { en: 'Role Strain & Conflict', hi: 'भूमिका टकराव और समय की कमी', mr: 'कौटुंबिक आणि सामाजिक जबाबदाऱ्यांचा ताण' },
    financial_strain: { en: 'Financial Strain', hi: 'आर्थिक दबाव', mr: 'आर्थिक भार' },
    competency: { en: 'Care Competency & Uncertainty', hi: 'देखभाल क्षमता और अनिश्चितता', mr: 'काळजी घेण्याची क्षमता आणि अनिश्चितता' },
    guilt: { en: 'Guilt & Self-Criticism', hi: 'अपराधबोध और आत्म-आलोचना', mr: 'अपराधभाव आणि असमाधान' },
    global_burden: { en: 'Global Burden Anchor', hi: 'समग्र बोझ', mr: 'एकंदरीत ताण' }
  };

  const factors = {} as Record<ZbiFactor, FactorDetail>;
  for (const factorKey of Object.keys(factorAccumulators) as ZbiFactor[]) {
    const acc = factorAccumulators[factorKey];
    const isMeasured = acc.max > 0;
    const percentage = isMeasured ? Math.round((acc.score / acc.max) * 100) : null;
    
    let note = {
      en: isMeasured ? 'Within normal manageable threshold.' : 'Not assessed in this short form. Take ZBI-22 for complete factor analysis.',
      hi: isMeasured ? 'सामान्य सीमा के भीतर।' : 'इस छोटे फॉर्म में इसका मूल्यांकन नहीं किया गया है।',
      mr: isMeasured ? 'सर्वसाधारण मर्यादेत.' : 'या संक्षिप्त फॉर्ममध्ये याचे मूल्यांकन केलेले नाही.'
    };

    if (isMeasured && percentage !== null) {
      if (percentage >= 70) {
        note = {
          en: 'Severe strain marker: High risk of exhaustion. Structured relief plan strongly advised.',
          hi: 'गंभीर तनाव: अत्यधिक थकान का उच्च जोखिम। तुरंत राहत योजना बनाएं।',
          mr: 'गंभीर ताण: त्वरित विश्रांती आणि सहाय्य आवश्यक.'
        };
      } else if (percentage >= 50) {
        note = {
          en: 'Moderate strain: Emerging role strain requiring targeted support.',
          hi: 'मध्यम तनाव: लक्षित सहायता और विश्राम की आवश्यकता।',
          mr: 'मध्यम ताण: नियोजित मदत आवश्यक.'
        };
      }
    }

    factors[factorKey] = {
      title: factorTitles[factorKey],
      rawScore: acc.score,
      maxScore: acc.max,
      percentage,
      isMeasured,
      clinicalNote: note
    };
  }

  // Domain Capacities (Remaining % = 100 - load)
  const domainCapacities: ZaritEvaluationResult['domainCapacities'] = {
    psychosocial: domainWeightsTotal.psychosocial > 0 ? Math.max(0, Math.round(100 - (domainLoads.psychosocial / domainWeightsTotal.psychosocial))) : null,
    resource: domainWeightsTotal.resource > 0 ? Math.max(0, Math.round(100 - (domainLoads.resource / domainWeightsTotal.resource))) : null,
    physical: domainWeightsTotal.physical > 0 ? Math.max(0, Math.round(100 - (domainLoads.physical / domainWeightsTotal.physical))) : null,
    safety: domainWeightsTotal.safety > 0 ? Math.max(0, Math.round(100 - (domainLoads.safety / domainWeightsTotal.safety))) : null,
    cognitive_behavioral: domainWeightsTotal.cognitive_behavioral > 0 ? Math.max(0, Math.round(100 - (domainLoads.cognitive_behavioral / domainWeightsTotal.cognitive_behavioral))) : null,
    medical: domainWeightsTotal.medical > 0 ? Math.max(0, Math.round(100 - (domainLoads.medical / domainWeightsTotal.medical))) : null
  };

  // Structured Clinical Prescriptions
  const prescriptions: CaregiverPrescription[] = [];

  // Prescription 1: Respite & Physical Relief (Triggered on personal strain >= 50% or overall severity)
  if (
    (factors.personal_strain.percentage !== null && factors.personal_strain.percentage >= 50) ||
    severityBand === 'red' ||
    severityBand === 'critical_red'
  ) {
    prescriptions.push({
      id: 'rx_respite',
      category: 'Respite & Relief',
      title: {
        en: 'Mandatory Scheduled Weekly Respite',
        hi: 'साप्ताहिक अनिवार्य देखभाल विश्राम',
        mr: 'साप्ताहिक नियोजित विश्रांती'
      },
      action: {
        en: 'Try to arrange at least 4 continuous daytime hours this week where another family member or attendant takes full charge of direct care.',
        hi: 'इस सप्ताह कम से कम 4 घंटे का समय तय करें जिसमें परिवार का कोई अन्य सदस्य देखभाल की पूरी जिम्मेदारी संभाले।',
        mr: 'या आठवड्यात किमान ४ तास इतर कोणाकडे तरी सर्व जबाबदारी सोपवून स्वतःसाठी वेळ काढा.'
      },
      recommendedLink: '/care-circle',
      linkText: {
        en: 'Delegate in Care Circle',
        hi: 'केयर सर्कल में कार्य सौंपें',
        mr: 'केअर सर्कलमध्ये कामे सोपवा'
      },
      urgency: severityBand === 'critical_red' ? 'urgent' : 'priority'
    });
  }

  // Prescription 2: Tele-MANAS Psychological Support (Triggered on guilt >= 50% OR overall normalized >= 55% for short forms)
  if (
    (factors.guilt.isMeasured && factors.guilt.percentage !== null && factors.guilt.percentage >= 50) ||
    normalizedPercentage >= 55 ||
    severityBand === 'critical_red'
  ) {
    prescriptions.push({
      id: 'rx_telemanas',
      category: 'Psychological Support',
      title: {
        en: 'Tele-MANAS Psychological Counseling',
        hi: 'टेली-मानस निःशुल्क मानसिक परामर्श (14416)',
        mr: 'टेलि-मानस मोफत समुपदेशन (14416)'
      },
      action: {
        en: 'Speak with a certified clinical counselor via toll-free 14416 to process caregiver anxiety, guilt, and emotional exhaustion.',
        hi: 'देखभाल संबंधी चिंता, थकान और अपराधबोध से उबरने के लिए टोल-फ्री 14416 पर बात करें।',
        mr: 'ताण आणि चिंता निवारणासाठी टोल-फ्री १४४१६ वर संपर्क साधा.'
      },
      recommendedLink: 'tel:14416',
      linkText: {
        en: 'Call 14416 (24x7 Toll-Free)',
        hi: '14416 पर कॉल करें',
        mr: '१४४१६ वर कॉल करा'
      },
      urgency: severityBand === 'critical_red' ? 'urgent' : 'priority'
    });
  }

  // Prescription 3: Fall & Bed-Bound Safety Checklist
  if (factors.personal_strain.percentage !== null && factors.personal_strain.percentage >= 40) {
    prescriptions.push({
      id: 'rx_fall_safety',
      category: 'Skill Training',
      title: {
        en: 'Fall Prevention & Positioning Review',
        hi: 'गिरने से बचाव और सुरक्षित पोस्चर प्रशिक्षण',
        mr: 'पडणे प्रतिबंध आणि योग्य पोझिशनिंग'
      },
      action: {
        en: 'Review transfer biomechanics to protect your back and conduct a home safety scan for throw rugs, wet tiles, and poor lighting.',
        hi: 'कमर के बचाव के लिए सुरक्षित लिफ्टिंग तकनीक सीखें और घर में फिसलने वाली जगहों की जांच करें।',
        mr: 'स्वतःच्या पाठीच्या संरक्षणासाठी योग्य पद्धती वापरा आणि घरातील सुरक्षितता तपासा.'
      },
      recommendedLink: '/modules/fall-prevention',
      linkText: {
        en: 'Open Fall Prevention Module',
        hi: 'फॉल प्रिवेंशन मॉड्यूल खोलें',
        mr: 'पडणे प्रतिबंध मॉड्यूल उघडा'
      },
      urgency: 'routine'
    });
  }

  // Crisis evaluation: Evaluates red flags, critical band, or short-form clinical cutoffs
  const isCrisisTriggered =
    redFlags.length > 0 ||
    severityBand === 'critical_red' ||
    (tier === 'ZBI4' && totalScore >= 12) ||
    (tier === 'ZBI12' && totalScore >= 28);

  return {
    tier,
    totalScore,
    maxScore,
    normalizedPercentage,
    classification,
    severityBand,
    factors,
    domainCapacities,
    redFlags,
    isCrisisTriggered,
    prescriptions,
    provenance: {
      score: CLINICAL_PROVENANCE.zaritScore,
      triageOverlay: CLINICAL_PROVENANCE.careGapHeuristic
    },
    completedAt: new Date().toISOString()
  };
}
