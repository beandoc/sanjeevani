import { describe, expect, it } from 'vitest';
import { getDyadWorkflow } from './dyad-workflow';
import type { CaregiverAttributes, PatientDependenceProfile } from './care-gap-engine';

const patient: PatientDependenceProfile = {
  name: 'Meera Shah', age: 82, homeCareAddress: '12 Lake Road', primaryConditions: [],
  katzAdl: { bathing: false, dressing: false, toileting: false, transferring: false, continence: true, feeding: true },
  lawtonIadl: { telephone: false, shopping: false, mealPreparation: false, housekeeping: false, laundry: false, transportation: false, medicationManagement: false, finances: false },
  cognitiveBehavioralLoad: 'none', fallHistoryLast6Months: 0, isBedBound: false
};

const caregiver: CaregiverAttributes = {
  name: 'Riya Shah', age: 48, gender: 'female', kinship: 'daughter', coResidence: 'lives_together', education: 'graduate', employment: 'full_time',
  dailyHoursCommitted: 5, monthlyOutOfPocketBurden: 'manageable', formalTrainingReceived: false,
  caregiverHealth: { hasBackPain: false, hasHypertension: false, hasArthritis: false, hasDiabetes: false, hasInsomnia: false },
  homeEnvironment: { houseAddress: '12 Lake Road', hasDedicatedRoom: true, hasAttachedBathroom: false, floorLevel: 'ground' },
  assessmentMetadata: { assessedAt: '2026-09-01T00:00:00.000Z', source: 'caregiver_reported' }
};

describe('dyad workflow', () => {
  it('does not make a care-gap plan eligible from registration/home defaults alone', () => {
    const workflow = getDyadWorkflow({ patient, caregiver, functionAssessmentCount: 0, burdenAssessmentCount: 0 });
    expect(workflow.stage).toBe('function_assessment');
    expect(workflow.isCarePlanningReady).toBe(false);
    expect(workflow.nextOwner).toBe('clinician');
  });

  it('only enables respite evaluation after a care matrix and burden baseline', () => {
    const matrixCaregiver = {
      ...caregiver,
      careBlueprint: {
        id: 'plan-1', prescribedByDoctor: 'Dr A', prescribedAt: '2026-09-01T00:00:00.000Z', clinicalSummary: 'Plan',
        recommendedSupportType: 'family_redistribution' as const, recommendedShiftWindow: 'family_schedule' as const,
        recommendedHoursPerDay: 4, clinicalPrecautions: [], recommendedAssistiveDevices: { hospitalBed: 'none' as const, airWaterMattress: false, wheelchair: false, suctionApparatus: false, transferAids: false },
        recommendedRespiteDaysPerMonth: 2, status: 'draft_prescribed' as const,
        clinicalReview: { decision: 'issued_by_clinician' as const, reviewedAt: '2026-09-01T00:00:00.000Z', reviewedBy: 'Dr A', policyVersion: '1', decisionSupportStatus: 'ready_for_clinician_review' as const }
      }
    };
    expect(getDyadWorkflow({ patient, caregiver: matrixCaregiver, functionAssessmentCount: 1, burdenAssessmentCount: 0 }).isRespiteEvaluationReady).toBe(false);
    expect(getDyadWorkflow({ patient, caregiver: matrixCaregiver, functionAssessmentCount: 1, burdenAssessmentCount: 1 }).isRespiteEvaluationReady).toBe(true);
  });
});
