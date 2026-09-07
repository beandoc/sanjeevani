/**
 * Sanjeevani Clinical Personalized Path Engine
 * Integrates caregiver scenario, psychometrics, and patient dependence/multimorbidity profile.
 */

import { allModules } from './modules';
import { ClinicalRecommendationEngine, RecommendationOutput } from './recommendations/rules-engine';
import { HealthRepository } from './db/health-repository';
import { PatientDependenceProfile } from './clinical/care-gap-engine';
import { MedicationItem } from './db/health-repository/types';

export interface PersonalizedPathResult {
  suggestedModules: Array<typeof allModules[0] & {
    focusArea: string;
    matchScore: number;
    urgency: string;
    clinicalRationale: string[];
    conditionMatchTag?: string;
  }>;
  prescriptions: RecommendationOutput['clinicalPrescriptions'];
  reasoning: string;
  crisisEscalationRequired: boolean;
  crisisTriggers: string[];
  matchedPatientName?: string;
}

export const getPersonalizedPath = (
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  caregivingScenario: string,
  role: 'caregiver' | 'nurse' | 'doctor' | 'professional' = 'caregiver',
  customPatientProfile?: PatientDependenceProfile | null,
  customMedications?: MedicationItem[]
): PersonalizedPathResult => {
  const zaritHistory = HealthRepository.getZaritAssessments();
  const lastZarit = zaritHistory.length > 0 ? zaritHistory[0] : null;
  const completedSectionMap = HealthRepository.getModuleProgressMap();

  const patientProfile =
    customPatientProfile !== undefined
      ? customPatientProfile
      : HealthRepository.getPatientProfile();

  const medications =
    customMedications !== undefined
      ? customMedications
      : HealthRepository.getMedications();

  const evalResult = ClinicalRecommendationEngine.evaluate({
    role,
    skillLevel,
    caregivingScenario,
    lastZarit,
    completedSectionMap,
    patientProfile,
    medications
  });

  const matchedModules = evalResult.topRecommendations
    .map((rec) => {
      const found = allModules.find((m) => m.id === rec.moduleId);
      if (!found) return null;
      return {
        ...found,
        focusArea: caregivingScenario,
        matchScore: rec.matchScore,
        urgency: rec.urgency,
        clinicalRationale: rec.clinicalRationale,
        conditionMatchTag: rec.conditionMatchTag
      };
    })
    .filter(Boolean) as Array<typeof allModules[0] & {
      focusArea: string;
      matchScore: number;
      urgency: string;
      clinicalRationale: string[];
      conditionMatchTag?: string;
    }>;

  const patientName = patientProfile?.name || 'your care recipient';
  let rationaleSummary = `Curated for ${caregivingScenario} at ${skillLevel} level, calibrated to ${patientName}'s clinical profile.`;
  if (patientProfile?.primaryConditions && patientProfile.primaryConditions.length > 0) {
    rationaleSummary += ` Active conditions: ${patientProfile.primaryConditions.slice(0, 3).join(', ')}.`;
  }
  if (patientProfile?.isBedBound) {
    rationaleSummary += ` Includes specialized bedbound nursing protocols.`;
  } else if ((patientProfile?.fallHistoryLast6Months || 0) > 0) {
    rationaleSummary += ` Prioritizes acute fall prevention (${patientProfile?.fallHistoryLast6Months} recent falls).`;
  }
  if (lastZarit) {
    rationaleSummary += ` Incorporates recent Zarit burden evaluation (${lastZarit.totalScore}/88 - ${lastZarit.severityBand} strain).`;
  }

  return {
    suggestedModules:
      matchedModules.length > 0
        ? matchedModules
        : allModules.slice(0, 3).map((m) => ({
            ...m,
            focusArea: caregivingScenario,
            matchScore: 80,
            urgency: 'recommended',
            clinicalRationale: [`Standard protocol for ${caregivingScenario}.`],
            conditionMatchTag: `Aligned: ${caregivingScenario}`
          })),
    prescriptions: evalResult.clinicalPrescriptions,
    reasoning: rationaleSummary,
    crisisEscalationRequired: evalResult.crisisEscalationRequired,
    crisisTriggers: evalResult.crisisTriggers,
    matchedPatientName: patientName
  };
};
