/**
 * Sanjeevani Clinical Personalized Path Engine
 * Replaced Math.random() with a deterministic clinical recommendation rules engine.
 */

import { allModules } from './modules';
import { ClinicalRecommendationEngine, RecommendationEngineInput, RecommendationOutput } from './recommendations/rules-engine';
import { HealthRepository } from './db/health-repository';

export interface PersonalizedPathResult {
  suggestedModules: Array<typeof allModules[0] & {
    focusArea: string;
    matchScore: number;
    urgency: string;
    clinicalRationale: string[];
  }>;
  prescriptions: RecommendationOutput['clinicalPrescriptions'];
  reasoning: string;
  crisisEscalationRequired: boolean;
  crisisTriggers: string[];
}

export const getPersonalizedPath = (
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  caregivingScenario: string,
  role: 'caregiver' | 'nurse' | 'doctor' | 'professional' = 'caregiver'
): PersonalizedPathResult => {
  const zaritHistory = HealthRepository.getZaritAssessments();
  const lastZarit = zaritHistory.length > 0 ? zaritHistory[0] : null;
  const completedSectionMap = HealthRepository.getModuleProgressMap();

  const evalResult = ClinicalRecommendationEngine.evaluate({
    role,
    skillLevel,
    caregivingScenario,
    lastZarit,
    completedSectionMap
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
        clinicalRationale: rec.clinicalRationale
      };
    })
    .filter(Boolean) as Array<typeof allModules[0] & {
      focusArea: string;
      matchScore: number;
      urgency: string;
      clinicalRationale: string[];
    }>;

  let rationaleSummary = `Curated for ${caregivingScenario} at ${skillLevel} level.`;
  if (lastZarit) {
    rationaleSummary += ` Incorporates recent Zarit burden evaluation (${lastZarit.totalScore}/88 - ${lastZarit.severityBand} strain).`;
  }

  return {
    suggestedModules: matchedModules.length > 0 ? matchedModules : allModules.slice(0, 3).map(m => ({
      ...m,
      focusArea: caregivingScenario,
      matchScore: 80,
      urgency: 'recommended',
      clinicalRationale: [`Standard protocol for ${caregivingScenario}.`]
    })),
    prescriptions: evalResult.clinicalPrescriptions,
    reasoning: rationaleSummary,
    crisisEscalationRequired: evalResult.crisisEscalationRequired,
    crisisTriggers: evalResult.crisisTriggers
  };
};
