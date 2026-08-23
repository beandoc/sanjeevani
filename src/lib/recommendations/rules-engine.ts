/**
 * Sanjeevani Clinical Recommendation Rules Engine
 * Deterministic, evidence-based recommendation system replacing arbitrary randomness.
 * Integrates:
 * 1. Caregiver Skill Level (Beginner / Intermediate / Advanced)
 * 2. Primary Care Scenario / Multimorbidity Profile
 * 3. Zarit Burden Scale (ZBI) 6-Factor Subscales & Red-Flag Crisis Triggers
 * 4. Longitudinal Module Completion History & Gaps
 */

import { ZaritEvaluationResult, ZbiFactor } from '@/lib/zarit-scale';

export interface ModuleRecommendation {
  moduleId: string;
  title: string;
  category: 'clinical' | 'caregiver-wellness' | 'practical-nursing' | 'medication-safety';
  rawScore: number;
  matchScore: number; // 0 to 100 for display
  urgency: 'critical' | 'high' | 'recommended' | 'elective';
  clinicalRationale: string[];
  targetRole: 'caregiver' | 'professional' | 'both';
  estimatedMinutes: number;
}

export interface RecommendationEngineInput {
  role: 'caregiver' | 'professional';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  caregivingScenario: string;
  lastZarit?: ZaritEvaluationResult | null;
  completedSectionMap?: Record<string, { completedSections: string[] }>;
}

export interface ClinicalPrescriptionAction {
  id: string;
  title: string;
  action: string;
  rationale: string;
  priority: 'immediate' | 'high' | 'routine';
  category: 'respite' | 'medical-review' | 'care-circle' | 'safety';
}

export interface RecommendationOutput {
  topRecommendations: ModuleRecommendation[];
  clinicalPrescriptions: ClinicalPrescriptionAction[];
  crisisEscalationRequired: boolean;
  crisisTriggers: string[];
}

const ALL_MODULES_CATALOG: Array<{
  moduleId: string;
  title: string;
  category: ModuleRecommendation['category'];
  baseScenarioWeights: Record<string, number>;
  skillLevelRelevance: Record<'beginner' | 'intermediate' | 'advanced', number>;
  targetRole: 'caregiver' | 'professional' | 'both';
  estimatedMinutes: number;
}> = [
  {
    moduleId: 'fall-prevention',
    title: 'Fall Prevention & Home Hazard Mitigation',
    category: 'practical-nursing',
    baseScenarioWeights: {
      'General Frailty': 95,
      'Parkinson\'s Disease': 98,
      'Stroke Recovery': 92,
      'Dementia': 85,
      'Post-Surgery Recovery': 90
    },
    skillLevelRelevance: { beginner: 100, intermediate: 85, advanced: 70 },
    targetRole: 'both',
    estimatedMinutes: 15
  },
  {
    moduleId: 'medication-management-caregiver',
    title: 'Safe Medication Routines & Blister Tracking',
    category: 'medication-safety',
    baseScenarioWeights: {
      'Heart Failure': 95,
      'Multiple Chronic Conditions': 98,
      'General Frailty': 88,
      'Dementia': 85,
      'COPD': 82
    },
    skillLevelRelevance: { beginner: 95, intermediate: 90, advanced: 75 },
    targetRole: 'caregiver',
    estimatedMinutes: 20
  },
  {
    moduleId: 'polypharmacy-professional',
    title: 'Geriatric Polypharmacy & Prescribing Cascades',
    category: 'medication-safety',
    baseScenarioWeights: {
      'Multiple Chronic Conditions': 100,
      'Heart Failure': 90,
      'General Frailty': 85
    },
    skillLevelRelevance: { beginner: 60, intermediate: 85, advanced: 100 },
    targetRole: 'professional',
    estimatedMinutes: 25
  },
  {
    moduleId: 'dementia-care',
    title: 'Dementia Care: Communication & Behavioral Triage',
    category: 'clinical',
    baseScenarioWeights: {
      'Dementia': 100,
      'General Frailty': 60,
      'Stroke Recovery': 55
    },
    skillLevelRelevance: { beginner: 95, intermediate: 90, advanced: 80 },
    targetRole: 'caregiver',
    estimatedMinutes: 25
  },
  {
    moduleId: 'bed-bound-care',
    title: 'Bed-Bound Nursing, Positioning & Pressure Sore Prevention',
    category: 'practical-nursing',
    baseScenarioWeights: {
      'Stroke Recovery': 95,
      'General Frailty': 85,
      'Post-Surgery Recovery': 90,
      'Multiple Chronic Conditions': 75
    },
    skillLevelRelevance: { beginner: 90, intermediate: 95, advanced: 85 },
    targetRole: 'both',
    estimatedMinutes: 20
  },
  {
    moduleId: 'heart-failure',
    title: 'Heart Failure Management & Daily Fluid/Weight Logs',
    category: 'clinical',
    baseScenarioWeights: {
      'Heart Failure': 100,
      'Multiple Chronic Conditions': 85,
      'General Frailty': 65
    },
    skillLevelRelevance: { beginner: 85, intermediate: 95, advanced: 90 },
    targetRole: 'both',
    estimatedMinutes: 20
  },
  {
    moduleId: 'palliative-care-caregiver',
    title: 'Comfort-First Palliative Care & Emotional Resilience',
    category: 'caregiver-wellness',
    baseScenarioWeights: {
      'General Frailty': 75,
      'Dementia': 80,
      'Multiple Chronic Conditions': 85
    },
    skillLevelRelevance: { beginner: 80, intermediate: 90, advanced: 95 },
    targetRole: 'caregiver',
    estimatedMinutes: 20
  },
  {
    moduleId: 'geriatric-rehabilitation',
    title: 'Functional Mobility & Post-Discharge Physio Routines',
    category: 'practical-nursing',
    baseScenarioWeights: {
      'Stroke Recovery': 100,
      'Parkinson\'s Disease': 95,
      'Post-Surgery Recovery': 95,
      'General Frailty': 80
    },
    skillLevelRelevance: { beginner: 85, intermediate: 95, advanced: 90 },
    targetRole: 'both',
    estimatedMinutes: 20
  },
  {
    moduleId: 'geriatric-depression-professional',
    title: 'Spotting Geriatric Depression & Caregiver Fatigue',
    category: 'caregiver-wellness',
    baseScenarioWeights: {
      'General Frailty': 80,
      'Dementia': 85,
      'Stroke Recovery': 80
    },
    skillLevelRelevance: { beginner: 70, intermediate: 90, advanced: 100 },
    targetRole: 'professional',
    estimatedMinutes: 20
  },
  {
    moduleId: 'constipation-caregiver',
    title: 'Elderly Bowel Care: Hydration vs Laxative Staging',
    category: 'clinical',
    baseScenarioWeights: {
      'General Frailty': 85,
      'Parkinson\'s Disease': 90,
      'Stroke Recovery': 80,
      'Post-Surgery Recovery': 85
    },
    skillLevelRelevance: { beginner: 90, intermediate: 85, advanced: 70 },
    targetRole: 'caregiver',
    estimatedMinutes: 15
  },
  {
    moduleId: 'parkinsonism-care',
    title: 'Parkinson’s Disease: Freezing of Gait & Safe Nutrition',
    category: 'clinical',
    baseScenarioWeights: {
      'Parkinson\'s Disease': 100,
      'General Frailty': 50
    },
    skillLevelRelevance: { beginner: 90, intermediate: 90, advanced: 85 },
    targetRole: 'caregiver',
    estimatedMinutes: 25
  },
  {
    moduleId: 'stroke-rehab',
    title: 'Post-Stroke Home Recovery & Aspiration Prevention',
    category: 'clinical',
    baseScenarioWeights: {
      'Stroke Recovery': 100,
      'General Frailty': 55
    },
    skillLevelRelevance: { beginner: 90, intermediate: 90, advanced: 85 },
    targetRole: 'both',
    estimatedMinutes: 25
  }
];

export class ClinicalRecommendationEngine {
  static evaluate(input: RecommendationEngineInput): RecommendationOutput {
    const { role, skillLevel, caregivingScenario, lastZarit, completedSectionMap = {} } = input;

    const crisisTriggers: string[] = [];
    let crisisEscalationRequired = false;

    // 1. Evaluate Crisis Flags from Zarit (reconciled with ZBI engine)
    if (lastZarit) {
      if (lastZarit.isCrisisTriggered || lastZarit.severityBand === 'critical_red') {
        crisisEscalationRequired = true;
        crisisTriggers.push(`Severe overall Zarit burden score: ${lastZarit.totalScore}/${lastZarit.maxScore} (${lastZarit.normalizedPercentage}%)`);
      }
      if (lastZarit.redFlags && lastZarit.redFlags.length > 0) {
        crisisEscalationRequired = true;
        lastZarit.redFlags.forEach((rf) => {
          if (!crisisTriggers.includes(rf)) crisisTriggers.push(rf);
        });
      }
    }

    // 2. Score All Modules Deterministically with Unclamped Continuous Ranking
    const scoredModules: ModuleRecommendation[] = ALL_MODULES_CATALOG.map((mod) => {
      let rawScore = 0;
      const rationale: string[] = [];

      // Base scenario alignment (Weight: 40%)
      const scenarioWeight = mod.baseScenarioWeights[caregivingScenario] || 50;
      rawScore += scenarioWeight * 0.4;
      if (scenarioWeight >= 85) {
        rationale.push(`Directly targets your recipient's profile: "${caregivingScenario}".`);
      }

      // Skill level calibration (Weight: 25%)
      const skillScore = mod.skillLevelRelevance[skillLevel] || 80;
      rawScore += skillScore * 0.25;
      if (skillLevel === 'beginner' && mod.skillLevelRelevance.beginner >= 90) {
        rationale.push(`Calibrated for beginner caregivers with step-by-step guidance.`);
      }

      // Role calibration (Weight: 15%)
      if (mod.targetRole === role || mod.targetRole === 'both') {
        rawScore += 15;
      } else {
        rawScore += 5;
      }

      // Zarit Subscale Psychometrics Boosts (Weight: 20%)
      if (lastZarit && lastZarit.factors) {
        const factors = lastZarit.factors;

        // Personal Strain elevated
        if (factors.personal_strain.isMeasured && (factors.personal_strain.percentage ?? 0) >= 60 && mod.category === 'caregiver-wellness') {
          rawScore += 15;
          rationale.push(`Elevated Zarit Personal Strain (${factors.personal_strain.percentage}%): prioritize caregiver respite.`);
        }

        // Competency / Control strain elevated
        if (factors.competency.isMeasured && (factors.competency.percentage ?? 0) >= 50 && (mod.category === 'practical-nursing' || mod.category === 'medication-safety')) {
          rawScore += 12;
          rationale.push(`Elevated Role Ambiguity & Uncertainty: structured clinical checklists recommended.`);
        }

        // Severe role strain
        if (factors.role_strain.isMeasured && (factors.role_strain.percentage ?? 0) >= 60 && mod.moduleId === 'fall-prevention') {
          rawScore += 10;
          rationale.push(`High Role Strain: proactive fall mitigation prevents sudden crisis events.`);
        }
      }

      // Incomplete Section Boost (Encourage finishing partial modules)
      const modProgress = completedSectionMap[mod.moduleId];
      const completedCount = modProgress?.completedSections?.length || 0;
      if (completedCount > 0 && completedCount < 4) {
        rawScore += 8;
        rationale.push(`You have completed ${completedCount} of 4 sections in this module.`);
      } else if (completedCount >= 4) {
        rawScore -= 20; // Completed module drops down to make room for new content
      }

      // Determine Urgency Level
      let urgency: ModuleRecommendation['urgency'] = 'recommended';
      if (rawScore >= 95) urgency = 'high';
      if (crisisEscalationRequired && mod.category === 'caregiver-wellness') urgency = 'critical';

      // Normalized display match percentage (10% to 100%)
      const matchScore = Math.min(100, Math.max(10, Math.round((rawScore / 115) * 100)));

      return {
        moduleId: mod.moduleId,
        title: mod.title,
        category: mod.category,
        rawScore,
        matchScore,
        urgency,
        clinicalRationale: rationale.length > 0 ? rationale : [`Standard core geriatric protocol for ${caregivingScenario}.`],
        targetRole: mod.targetRole,
        estimatedMinutes: mod.estimatedMinutes
      };
    });

    // Unclamped continuous sorting: True rawScore descending prevents clamp-induced declaration-order ties
    const sorted = scoredModules.sort((a, b) => b.rawScore - a.rawScore);

    // 3. Generate Specific Clinical Prescriptions
    const clinicalPrescriptions: ClinicalPrescriptionAction[] = [];

    if (lastZarit) {
      const { personal_strain, role_strain, guilt } = lastZarit.factors;

      if (
        (personal_strain.isMeasured && (personal_strain.percentage ?? 0) >= 60) ||
        lastZarit.normalizedPercentage >= 65
      ) {
        clinicalPrescriptions.push({
          id: 'rx-respite-block',
          title: 'Mandatory 4-Hour Weekly Respite Block',
          action: 'Delegate continuous care tasks to a secondary care circle member or day-care center for at least 4 continuous daytime hours this week.',
          rationale: `Personal strain indicator (${lastZarit.totalScore}/${lastZarit.maxScore}) reflects elevated risk for clinical burnout and sleep disruption.`,
          priority: 'immediate',
          category: 'respite'
        });
      }

      if (role_strain.isMeasured && (role_strain.percentage ?? 0) >= 50) {
        clinicalPrescriptions.push({
          id: 'rx-care-circle-sync',
          title: 'Formal Care Circle Task Redistribution',
          action: 'Open Care Circle hub and assign at least 2 recurring weekly tasks (medication refills, clinic transport) to other family members.',
          rationale: `Role strain score (${role_strain.rawScore}/${role_strain.maxScore}) indicates caregiver role overload.`,
          priority: 'high',
          category: 'care-circle'
        });
      }

      // Tele-MANAS support reachable for all tiers (full or short forms)
      if (
        (guilt.isMeasured && (guilt.percentage ?? 0) >= 50) ||
        lastZarit.normalizedPercentage >= 55 ||
        lastZarit.isCrisisTriggered
      ) {
        clinicalPrescriptions.push({
          id: 'rx-telemanas-support',
          title: 'Caregiver Psychological Triage (Tele-MANAS 14416)',
          action: 'Connect with a certified geriatric counselor via toll-free Tele-MANAS (14416) for emotional grounding.',
          rationale: 'Elevated psychometric strain detected in Zarit evaluation.',
          priority: 'high',
          category: 'respite'
        });
      }
    } else {
      clinicalPrescriptions.push({
        id: 'rx-baseline-zarit',
        title: 'Conduct Baseline Zarit Burden Assessment',
        action: 'Complete the Zarit Burden Scale to establish your baseline stress gauge.',
        rationale: 'Clinical decision-support tools require regular psychometric tracking.',
        priority: 'routine',
        category: 'medical-review'
      });
    }

    return {
      topRecommendations: sorted.slice(0, 5),
      clinicalPrescriptions,
      crisisEscalationRequired,
      crisisTriggers
    };
  }
}
