import type { CaregiverAttributes, PatientDependenceProfile } from './care-gap-engine';

export type DyadWorkflowStage =
  | 'registration'
  | 'function_assessment'
  | 'home_context'
  | 'caregiver_capacity'
  | 'care_matrix'
  | 'longitudinal_monitoring';

export interface WorkflowStepDetail {
  id: DyadWorkflowStage;
  label: string;
  shortLabel: string;
  isCompleted: boolean;
  isCurrent: boolean;
  owner: 'caregiver' | 'clinician' | 'shared';
  actionPrompt: string;
}

export interface DyadWorkflow {
  stage: DyadWorkflowStage;
  completedSteps: number;
  totalSteps: number;
  isCarePlanningReady: boolean;
  isRespiteEvaluationReady: boolean;
  nextOwner: 'caregiver' | 'clinician' | 'shared';
  nextAction: string;
  missing: string[];
  steps?: WorkflowStepDetail[];
}

function hasHomeContext(caregiver: CaregiverAttributes | null, patient: PatientDependenceProfile | null) {
  const home = caregiver?.homeEnvironment;
  const address = (patient?.homeCareAddress || home?.houseAddress || '').trim();
  return Boolean(
    address.length > 0 &&
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
      caregiver.dailyHoursCommitted > 0 &&
      caregiver.caregiverHealth &&
      caregiver.assessmentMetadata?.assessedAt
  );
}

/**
 * The 6-step geriatric dyad care pathway in logical clinical order:
 * 1. Registration (Identity, primary chronic conditions, dyad link)
 * 2. Function Assessment (Katz ADL / Barthel index & Lawton IADL baseline)
 * 3. Home Context (House address, floor level, room & bathroom accessibility)
 * 4. Caregiver Capacity (Available hours, caregiver health constraints, strain)
 * 5. Care Matrix (Diurnal support roster, task delegation, equipment, transit readiness)
 * 6. Longitudinal Monitoring (ZBI caregiver burden, vitals, scissors trajectory)
 */
export function getDyadWorkflow(input: {
  patient: PatientDependenceProfile | null;
  caregiver: CaregiverAttributes | null;
  functionAssessmentCount: number;
  burdenAssessmentCount: number;
}): DyadWorkflow {
  const { patient, caregiver, functionAssessmentCount, burdenAssessmentCount } = input;
  const hasRegistration = Boolean(patient?.name?.trim() && patient.age > 0);
  const functionReady = functionAssessmentCount > 0;
  const homeReady = hasHomeContext(caregiver, patient);
  const caregiverReady = hasCaregiverCapacity(caregiver);
  const matrixReady = Boolean(caregiver?.careBlueprint?.clinicalReview?.decision);
  const monitoringReady = burdenAssessmentCount > 0;

  const stepDefinitions: Omit<WorkflowStepDetail, 'isCurrent'>[] = [
    {
      id: 'registration',
      label: 'Registration',
      shortLabel: 'Registration',
      isCompleted: hasRegistration,
      owner: 'clinician',
      actionPrompt: 'Complete patient and primary caregiver registration.'
    },
    {
      id: 'function_assessment',
      label: 'Function Assessment',
      shortLabel: 'Function',
      isCompleted: functionReady,
      owner: 'clinician',
      actionPrompt: 'Record patient baseline functional mobility (Barthel ADL & Lawton IADL).'
    },
    {
      id: 'home_context',
      label: 'Home Context',
      shortLabel: 'Home',
      isCompleted: homeReady,
      owner: 'caregiver',
      actionPrompt: 'Document home address, room layout, and bathroom accessibility constraints.'
    },
    {
      id: 'caregiver_capacity',
      label: 'Caregiver Capacity',
      shortLabel: 'Caregiver',
      isCompleted: caregiverReady,
      owner: 'caregiver',
      actionPrompt: 'Complete caregiver capacity, physical health, and available daily hours check-in.'
    },
    {
      id: 'care_matrix',
      label: 'Care Matrix',
      shortLabel: 'Matrix',
      isCompleted: matrixReady,
      owner: 'shared',
      actionPrompt: 'Build and clinically review the care matrix: staffing, diurnal shifts, equipment, and transit readiness.'
    },
    {
      id: 'longitudinal_monitoring',
      label: 'Longitudinal Monitoring',
      shortLabel: 'Monitor',
      isCompleted: monitoringReady,
      owner: 'shared',
      actionPrompt: 'Conduct remote Zarit burden check-ins (ZBI), vitals tracking, and scissors trajectory surveillance.'
    }
  ];

  const currentStepIndex = stepDefinitions.findIndex((s) => !s.isCompleted);
  const activeIndex = currentStepIndex === -1 ? stepDefinitions.length - 1 : currentStepIndex;

  const steps: WorkflowStepDetail[] = stepDefinitions.map((s, idx) => ({
    ...s,
    isCurrent: idx === activeIndex
  }));

  const activeStep = steps[activeIndex];
  const completedSteps = steps.filter((s) => s.isCompleted).length;
  const isCarePlanningReady = hasRegistration && functionReady;

  return {
    stage: activeStep.id,
    completedSteps,
    totalSteps: steps.length,
    isCarePlanningReady,
    isRespiteEvaluationReady: isCarePlanningReady && matrixReady && monitoringReady,
    nextOwner: activeStep.owner,
    nextAction: activeStep.actionPrompt,
    missing: steps.filter((s) => !s.isCompleted).map((s) => s.label),
    steps
  };
}

export const DYAD_WORKFLOW_LABEL: Record<DyadWorkflowStage, string> = {
  registration: 'Registration',
  function_assessment: 'Function Assessment',
  home_context: 'Home Context',
  caregiver_capacity: 'Caregiver Capacity',
  care_matrix: 'Care Matrix',
  longitudinal_monitoring: 'Longitudinal Monitoring'
};
