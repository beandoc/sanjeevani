import type { CaregiverAttributes, PatientDependenceProfile } from './care-gap-engine';
import { CLINICAL_POLICY } from './clinical-policy';

export type AssessmentSource = 'clinician_assisted' | 'caregiver_reported' | 'record_review' | 'unknown';

export interface ClinicalAssessmentMetadata {
  assessedAt?: string;
  source?: AssessmentSource;
}

export type ClinicalDecisionSupportStatus =
  | 'requires_data_completion'
  | 'requires_clinician_review'
  | 'ready_for_clinician_review';

export interface ClinicalDataQuality {
  status: ClinicalDecisionSupportStatus;
  completeness: 'insufficient' | 'partial' | 'complete';
  missingFields: string[];
  limitations: string[];
  assessedAt?: string;
  assessmentAgeDays: number | null;
  policyVersion: string;
}

function hasAllBooleans(record: object | null | undefined, keys: string[]): boolean {
  const candidate = record as Record<string, unknown> | null | undefined;
  return !!candidate && keys.every((key) => typeof candidate[key] === 'boolean');
}

function assessmentAgeDays(assessedAt: string | undefined, now: Date): number | null {
  if (!assessedAt) return null;
  const date = new Date(assessedAt);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

/**
 * Exposes missing or stale inputs so the UI can abstain from presenting a
 * heuristic as a complete patient-specific plan. It does not assess clinical
 * truth; it assesses whether the model's required inputs are documented.
 */
export function assessClinicalDataQuality(
  caregiver: CaregiverAttributes,
  patient: PatientDependenceProfile,
  now: Date = new Date()
): ClinicalDataQuality {
  const missingFields: string[] = [];
  const limitations: string[] = [];
  const katzKeys = ['bathing', 'dressing', 'toileting', 'transferring', 'continence', 'feeding'];
  const lawtonKeys = ['telephone', 'shopping', 'mealPreparation', 'housekeeping', 'laundry', 'transportation', 'medicationManagement', 'finances'];

  if (!Number.isFinite(patient.age) || patient.age <= 0) missingFields.push('Patient age');
  if (!hasAllBooleans(patient.katzAdl, katzKeys)) missingFields.push('Complete Katz ADL assessment');
  if (!hasAllBooleans(patient.lawtonIadl, lawtonKeys)) missingFields.push('Complete Lawton IADL assessment');
  if (!Number.isFinite(patient.fallHistoryLast6Months) || patient.fallHistoryLast6Months < 0) missingFields.push('Fall history');
  if (!Number.isFinite(caregiver.age) || caregiver.age <= 0) missingFields.push('Caregiver age');
  if (!Number.isFinite(caregiver.dailyHoursCommitted) || caregiver.dailyHoursCommitted < 0) missingFields.push('Caregiver available hours');
  if (!hasAllBooleans(caregiver.caregiverHealth, ['hasBackPain', 'hasHypertension', 'hasArthritis', 'hasDiabetes', 'hasInsomnia'])) {
    missingFields.push('Caregiver health screen');
  }

  const metadata = patient.assessmentMetadata;
  const ageDays = assessmentAgeDays(metadata?.assessedAt, now);
  if (!metadata?.assessedAt || ageDays === null) {
    limitations.push('Assessment date unrecorded; confirm function & support data remain current.');
  } else if (ageDays > CLINICAL_POLICY.assessmentFreshnessDays) {
    limitations.push(`Assessment is ${ageDays}d old; review functional capacity before changing staffing.`);
  }

  if (!patient.currentMedications) {
    limitations.push('Medication list pending documentation; risk screening incomplete.');
  }
  if (!Number.isFinite(patient.renalFunctionEgfr)) {
    limitations.push('eGFR unrecorded; renal-sensitive medication review is incomplete.');
  }
  if (!patient.goalsOfCare?.whatMattersMost || !patient.goalsOfCare?.escalationPreference || patient.goalsOfCare.escalationPreference === 'not_documented') {
    limitations.push('Goals of care and escalation preference are undocumented; confirm before issuing a patient-specific plan.');
  }
  if (!patient.clinicalAssessments?.fourAt) limitations.push('Delirium screen (4AT) not documented.');
  if (patient.isBedBound && !patient.clinicalAssessments?.braden) limitations.push('Pressure-injury risk (Braden) not documented for bed-bound care.');
  if (!patient.clinicalAssessments?.clinicalFrailtyScale) limitations.push('Clinical Frailty Scale not documented.');
  if (!patient.clinicalAssessments?.mnaSf) limitations.push('Nutrition screen (MNA-SF) not documented.');
  if (!patient.clinicalAssessments?.painad && patient.cognitiveBehavioralLoad !== 'none') limitations.push('Pain assessment (PAINAD or clinician alternative) not documented for cognitive impairment.');
  if (patient.isBedBound && !patient.skinIntegrity?.lastSkinCheckAt) limitations.push('Skin inspection and wound/pressure-injury status are not documented for bed-bound care.');
  if (!patient.nutritionMonitoring?.dysphagiaRisk || patient.nutritionMonitoring.dysphagiaRisk === 'not_screened') limitations.push('Swallow safety screening is not documented.');
  if (!patient.weightKg && !patient.heightCm && !patient.katzAdl?.transferring) {
    limitations.push('Height/weight unrecorded; transfer-load estimates have reduced precision.');
  }
  if (metadata?.source === 'caregiver_reported') {
    limitations.push('caregiver-reported score; confirm clinically before escalation.');
  }
  const completeness = missingFields.length > 0 ? 'insufficient' : limitations.length > 0 ? 'partial' : 'complete';
  const status: ClinicalDecisionSupportStatus = missingFields.length > 0
    ? 'requires_data_completion'
    : limitations.length > 0
      ? 'requires_clinician_review'
      : 'ready_for_clinician_review';

  return {
    status,
    completeness,
    missingFields,
    limitations,
    assessedAt: metadata?.assessedAt,
    assessmentAgeDays: ageDays,
    policyVersion: CLINICAL_POLICY.version
  };
}
