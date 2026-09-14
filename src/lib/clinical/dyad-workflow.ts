/**
 * The operational state of a home-care dyad.
 *
 * Registration is deliberately not treated as an assessment.  This small
 * model is shared by the doctor worklist and caregiver portal so neither can
 * turn missing information into an apparently patient-specific care plan.
 */
import type { CaregiverAttributes, PatientDependenceProfile } from './care-gap-engine';

export type DyadWorkflowStage =
  | 'registration'
  | 'home_context'
  | 'function_assessment'
  | 'caregiver_capacity'
  | 'care_matrix'
  | 'longitudinal_monitoring';

export interface DyadWorkflow {
  stage: DyadWorkflowStage;
  completedSteps: number;
  totalSteps: number;
  isCarePlanningReady: boolean;
  isRespiteEvaluationReady: boolean;
  nextOwner: 'caregiver' | 'clinician' | 'shared';
  nextAction: string;
  missing: string[];
}

function hasHomeContext(caregiver: CaregiverAttributes | null, patient: PatientDependenceProfile | null) {
  const home = caregiver?.homeEnvironment;
  return Boolean(
    (patient?.homeCareAddress || home?.houseAddress) &&
      typeof home?.hasDedicatedRoom === 'boolean' &&
      typeof home?.hasAttachedBathroom === 'boolean' &&
      home?.floorLevel
  );
}

function hasCaregiverCapacity(caregiver: CaregiverAttributes | null) {
  return Boolean(
    caregiver &&
      caregiver.name.trim() &&
      caregiver.age > 0 &&
      Number.isFinite(caregiver.dailyHoursCommitted) &&
      caregiver.caregiverHealth &&
      typeof caregiver.caregiverHealth.hasBackPain === 'boolean' &&
      typeof caregiver.caregiverHealth.hasInsomnia === 'boolean' &&
      caregiver.assessmentMetadata?.assessedAt
  );
}

/**
 * A completed Barthel/Lawton encounter is the functional baseline.  We do
 * not accept merged default booleans in the profile as proof of assessment:
 * that was the source of cards that looked complete immediately after intake.
 */
export function getDyadWorkflow(input: {
  patient: PatientDependenceProfile | null;
  caregiver: CaregiverAttributes | null;
  functionAssessmentCount: number;
  burdenAssessmentCount: number;
}): DyadWorkflow {
  const { patient, caregiver, functionAssessmentCount, burdenAssessmentCount } = input;
  const hasRegistration = Boolean(patient?.name?.trim() && patient.age > 0);
  const homeReady = hasHomeContext(caregiver, patient);
  const functionReady = functionAssessmentCount > 0;
  const caregiverReady = hasCaregiverCapacity(caregiver);
  const matrixReady = Boolean(caregiver?.careBlueprint?.clinicalReview?.decision);
  const monitoringReady = burdenAssessmentCount > 0;
  const completedSteps = [hasRegistration, homeReady, functionReady, caregiverReady, matrixReady, monitoringReady]
    .filter(Boolean).length;

  if (!hasRegistration) {
    return { stage: 'registration', completedSteps, totalSteps: 6, isCarePlanningReady: false, isRespiteEvaluationReady: false, nextOwner: 'clinician', nextAction: 'Complete patient and primary caregiver registration.', missing: ['Patient identity and age'] };
  }
  if (!homeReady) {
    return { stage: 'home_context', completedSteps, totalSteps: 6, isCarePlanningReady: false, isRespiteEvaluationReady: false, nextOwner: 'caregiver', nextAction: 'Document the home, room, bathroom and access constraints.', missing: ['Home address and care environment'] };
  }
  if (!functionReady) {
    return { stage: 'function_assessment', completedSteps, totalSteps: 6, isCarePlanningReady: false, isRespiteEvaluationReady: false, nextOwner: 'clinician', nextAction: 'Record the patient functional assessment (Barthel/Lawton).', missing: ['Clinician functional baseline'] };
  }
  if (!caregiverReady) {
    return { stage: 'caregiver_capacity', completedSteps, totalSteps: 6, isCarePlanningReady: false, isRespiteEvaluationReady: false, nextOwner: 'caregiver', nextAction: 'Complete caregiver capacity, health and available-hours check-in.', missing: ['Caregiver capacity baseline'] };
  }
  if (!matrixReady) {
    return { stage: 'care_matrix', completedSteps, totalSteps: 6, isCarePlanningReady: true, isRespiteEvaluationReady: false, nextOwner: 'shared', nextAction: 'Build and clinically review the care matrix: people, tasks, shifts and equipment.', missing: ['Clinician-reviewed care matrix'] };
  }
  if (!monitoringReady) {
    return { stage: 'longitudinal_monitoring', completedSteps, totalSteps: 6, isCarePlanningReady: true, isRespiteEvaluationReady: false, nextOwner: 'caregiver', nextAction: 'Complete the first caregiver-burden check-in to establish a baseline.', missing: ['Zarit burden baseline'] };
  }
  return { stage: 'longitudinal_monitoring', completedSteps, totalSteps: 6, isCarePlanningReady: true, isRespiteEvaluationReady: true, nextOwner: 'shared', nextAction: 'Continue remote check-ins; review changes in function and caregiver burden together.', missing: [] };
}

export const DYAD_WORKFLOW_LABEL: Record<DyadWorkflowStage, string> = {
  registration: 'Registration',
  home_context: 'Home context',
  function_assessment: 'Function assessment',
  caregiver_capacity: 'Caregiver capacity',
  care_matrix: 'Care matrix',
  longitudinal_monitoring: 'Longitudinal monitoring'
};
