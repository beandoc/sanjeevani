/**
 * Record shapes stored by the health repository.
 */

import {
  CaregiverAttributes,
  LawtonIadlProfile,
  PatientDependenceProfile,
  CareGapEvaluationResult
} from '@/lib/clinical/care-gap-engine';
export type { CaregiverAttributes, PatientDependenceProfile, LawtonIadlProfile, CareGapEvaluationResult };

export interface VitalRecord {
  id: string;
  date: string; // ISO string
  weight?: string;
  pulse?: string;
  bp?: string;
  systolic?: string;
  diastolic?: string;
  spo2?: string;
  temperatureC?: string;
  respiratoryRate?: string;
  bloodSugar?: string;
  sleep: 'good' | 'average' | 'poor';
  notes?: string;
  createdAt: string;
}

export type DailyCareShift = 'morning' | 'day' | 'evening' | 'night' | 'full_day';

export interface DailyCareLogVitalsRow {
  id: string;
  timeLabel: string;
  bloodSugar?: string;
  bp?: string;
  pulse?: string;
  spo2?: string;
  temperatureC?: string;
  respiratoryRate?: string;
  /** Structured caregiver/clinician observation; never inferred from free text. */
  acuteMentalStatusChange?: boolean;
  physiotherapy?: string;
  exercise?: string;
  remarks?: string;
}

export interface DailyCareLogMedication {
  id: string;
  label: string;
  slot: 'morning' | 'lunch' | 'evening' | 'night' | 'sos';
  given: boolean;
  notes?: string;
}

export interface DailyCareLog {
  id: string;
  date: string; // YYYY-MM-DD
  shift: DailyCareShift;
  patientUid?: string | null;
  patientName?: string | null;
  recordedByName?: string | null;
  recordedByRole: 'nurse' | 'medical_assistant' | 'caregiver' | 'doctor' | 'unknown';
  meals: {
    breakfast?: string;
    lunch?: string;
    eveningSnack?: string;
    dinner?: string;
    feedNotes?: string;
  };
  monitoringRows: DailyCareLogVitalsRow[];
  medications: DailyCareLogMedication[];
  stoolPassed: boolean | null;
  urineMorningMl?: string;
  urineEveningMl?: string;
  waterIntakeMl?: string;
  catheterChanged: boolean | null;
  sleep: 'good' | 'average' | 'poor' | 'not_recorded';
  generalRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRecord {
  id: string;
  date: string; // ISO string
  department: string;
  doctor: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ModuleSectionProgress {
  moduleId: string;
  completedSections: string[]; // Array/Set of section IDs e.g. ['item-1', 'item-2']
  lastAccessedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
  notifyOnCrisis: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string; // e.g. "Once daily", "Twice daily"
  timeOfDay: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos')[];
  foodRelation: 'before' | 'after' | 'with' | 'any';
  indication?: string;
  startDate?: string;
  duration?: string;
  renalFunctionEgfr?: number;
  riskHistory?: string[];
  instructions?: string;
  prescribedBy?: string;
  beersWarning?: string;
  takenToday?: boolean;
  takenSlots?: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'sos')[];
  lastTakenDate?: string;
}

export interface CareCircleMember {
  id: string;
  name: string;
  role: 'Primary Caregiver' | 'Family Member' | 'Home Nurse' | 'Visiting Doctor';
  phone: string;
  isSelf: boolean;
  avatarColor: string;
}

/** Display name used when a task's owner is no longer in the circle. */
export const UNASSIGNED_CARE_TASK_OWNER = 'Unassigned';

/** Prefix marking a circle member that mirrors a caregiver-matrix secondary member. */
export const MATRIX_MEMBER_PREFIX = 'matrix_';

/** Stable circle-member id for a given caregiver-matrix secondary member. */
export function matrixLinkedMemberId(secondaryMemberId: string): string {
  return `${MATRIX_MEMBER_PREFIX}${secondaryMemberId}`;
}

export interface CareCircleTask {
  id: string;
  title: string;
  /**
   * Stable link to the CareCircleMember who owns this task. Tasks used to bind by display name
   * alone, so renaming or removing a caregiver silently orphaned every task assigned to them
   * while still showing the old name as the responsible person.
   */
  assignedToId?: string;
  /** Denormalised for display; reconciled against `assignedToId` on every load. */
  assignedToName: string;
  category: 'meds' | 'physio' | 'hygiene' | 'appointment' | 'general';
  time: string;
  isCompleted: boolean;
  dueDate: string;
  /** Daily tasks roll forward to the current date instead of piling up as stale history. */
  recurrence?: 'once' | 'daily';
}

export interface UserConsentPreferences {
  hasConsented: boolean;
  vitalsTrackingConsent: boolean;
  psychometricConsent: boolean;
  consentTimestamp: string;
  dpdpNoticeVersion: string;
}

export interface RegisteredPatientRecord {
  patientUid: string;
  inviteCode: string;
  patientName: string;
  patientAge: number;
  primaryConditions: string[];
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  patientProfile?: PatientDependenceProfile;
  caregiverAttributes?: CaregiverAttributes;
  createdAt: string;
}

/* ------------------------------------------------------------------ *
 * CARE-TIME CALIBRATION LOG (Phase 0 instrumentation)
 *
 * Every care-demand estimate, and what the clinician actually decided after
 * seeing it. Two purposes:
 *
 *   1. Calibration-in-the-large, at near-zero cost. Comparing the model's
 *      range against what clinicians actually prescribe answers the
 *      first-order question — is the model systematically wrong, and in which
 *      direction — within weeks, without a diary study.
 *   2. Retrospective recalibration. The inputs are stored verbatim, so every
 *      historical estimate can be recomputed under new coefficients. Without
 *      the inputs, a calibration study can only improve future estimates and
 *      can never check itself against the record.
 *
 * Deliberately plain primitives rather than the live model types: this is an
 * analysis artifact that must survive model refactors and export cleanly to a
 * statistician. See docs/care-time-calibration-protocol.md.
 * ------------------------------------------------------------------ */

/** What the clinician did after seeing the estimate. */
export type CareDemandDecisionVerdict =
  | 'accepted'
  | 'revised_up'
  | 'revised_down'
  | 'rejected'
  | 'not_recorded';

export interface CareDemandEstimateSnapshot {
  activeCareLowHours: number;
  activeCarePointHours: number;
  activeCareHighHours: number;
  directCarePointHours: number;
  supervisionPointHours: number;
  onCallPointHours: number;
  coveragePointHours: number;
  bandRelativeHalfWidth: number;
  requiresNightPresence: boolean;
  inputGranularity: 'graded' | 'legacy_binary';
  assessmentSource: string;
  /** 0 = every coefficient measured locally, 1 = none. */
  uncalibratedShare: number;
  careGapClassification: 'covered' | 'indeterminate' | 'deficit';
  netCareGapHours: number;
  caregiverSafeCapacityHours: number;
}

/**
 * The inputs the estimate was computed from, stored verbatim so the estimate
 * can be recomputed when coefficients change.
 */
export interface CareDemandInputSnapshot {
  barthelResponses?: Record<string, number>;
  lawtonResponses?: Record<string, number>;
  premorbidlyNotPerformedIadl?: string[];
  careTaskFrequencyOverrides?: Record<string, number>;
  cognitiveBehavioralLoad?: string;
  isBedBound?: boolean;
  fallHistoryLast6Months?: number;
  hasMotorizedBedAndRippleMattress?: boolean;
}

export interface CareDemandDecision {
  decidedAt: string;
  decidedByRole: 'doctor' | 'nurse' | 'medical_assistant' | 'caregiver' | 'other';
  verdict: CareDemandDecisionVerdict;
  /** Formal/paid active-care hours per day the clinician actually settled on. */
  prescribedActiveCareHours?: number;
  /** Elapsed presence hours per day the clinician actually settled on. */
  prescribedCoverageHours?: number;
  /** Support types chosen, e.g. ['paid_attendant_12h']. */
  prescribedSupportTypes?: string[];
  /** Free-text rationale. Required by convention when revising or rejecting. */
  reason?: string;
}

export interface CareDemandEstimateLog {
  id: string;
  patientUid?: string | null;
  recordedAt: string;
  engineVersion: string;
  policyVersion: string;
  estimate: CareDemandEstimateSnapshot;
  inputs: CareDemandInputSnapshot;
  /** Absent until a clinician records what they decided. */
  decision?: CareDemandDecision;
}

/* ------------------------------------------------------------------ *
 * CAREGIVER 1-TAP DIARY & REAL-WORLD CALIBRATION TYPES
 * ------------------------------------------------------------------ */

export type CaregiverDiaryTimeBlock =
  | 'morning_rush'
  | 'afternoon'
  | 'evening'
  | 'night_watch';

export type CaregiverDiaryTaskCategory =
  | 'transfers_mobility'      // Bed-to-chair, walking assistance
  | 'bathing_hygiene'         // Sponge/bath, grooming, dressing
  | 'feeding_meals'           // Breakfast, lunch, dinner, hydration
  | 'medications'             // Pills, insulin, vitals
  | 'toileting_incontinence'  // Commode, diaper change, skin prep
  | 'night_repositioning'     // 2-hourly turns, sleep safety
  | 'general_supervision';    // Active wandering/fall vigilance

export type CaregiverDurationBracket =
  | 'under_15m'
  | '15_to_30m'
  | '30_to_60m'
  | '60_to_120m'
  | 'over_120m';

export interface CaregiverDiaryEntry {
  id: string;
  patientUid?: string | null;
  recordedAt: string;          // ISO timestamp
  date: string;                // YYYY-MM-DD
  timeBlock: CaregiverDiaryTimeBlock;
  taskCategory: CaregiverDiaryTaskCategory;
  durationBracket: CaregiverDurationBracket;
  durationMinutes: number;     // e.g. 10, 22.5, 45, 90, 150
  staffCount: 1 | 2;
  physicalStrain: 'mild' | 'moderate' | 'heavy_strain';
  notes?: string;
}

export interface CaregiverTaskCalibrationMetric {
  taskCategory: CaregiverDiaryTaskCategory;
  timeBlock: CaregiverDiaryTimeBlock;
  sampleCount: number;
  meanMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  twoPersonFrequencyPercent: number;
  lastLoggedAt: string;
}

export interface CaregiverDiaryCalibrationReport {
  patientUid?: string | null;
  totalEntries: number;
  firstLoggedAt?: string;
  lastLoggedAt?: string;
  metricsByTask: Record<string, CaregiverTaskCalibrationMetric>;
  averageDailyHandsOnMinutes: number;
  empiricalDirectCareHours: number;
}

/* ------------------------------------------------------------------ *
 * INPATIENT PRE-DISCHARGE CARE TIMING BENCHMARK TYPES
 * ------------------------------------------------------------------ */

export type InpatientObserverRole =
  | 'doctor'
  | 'staff_nurse'
  | 'gda_technician'
  | 'physiotherapist'
  | 'occupational_therapist';

export type InpatientTransferAssistType =
  | 'walker_standby'
  | 'one_person_pivot'
  | 'two_person_lift_or_sheet'
  | 'mechanical_hoist';

export type InpatientFeedingAssistType =
  | 'independent'
  | 'setup_and_prompting'
  | 'full_spoon_feeding'
  | 'enteral_tube_feeding';

export interface InpatientDischargeBenchmark {
  id: string;
  patientUid: string;
  recordedAt: string;          // ISO timestamp
  observerRole: InpatientObserverRole;
  observerName: string;
  wardOrBedNumber?: string;

  // Actual timed inpatient episodes in last 24-48h pre-discharge
  spongeBathMinutes: number;
  spongeBathStaffCount: 1 | 2;

  bedToChairTransferMinutes: number;
  transferStaffCount: 1 | 2;
  transferAssistType: InpatientTransferAssistType;

  mealFeedingMinutesPerMeal: number;
  mealsRequiringAssistancePerDay: number;
  feedingAssistType: InpatientFeedingAssistType;

  toiletingDiaperMinutes: number;
  toiletingEpisodesPerDay: number;
  toiletingStaffCount: 1 | 2;

  repositioningTurnMinutes: number;
  repositioningIntervalHours: number;
  repositioningStaffCount: 1 | 2;

  medicationAdministrationMinutes: number;
  medicationSlotsPerDay: number;

  // Environmental Translation Multiplier (Hospital -> Home adaptation penalty)
  // Default is 1.35x (hospital motorized bed -> home domestic bed/narrow doors)
  environmentalPenaltyMultiplier: number;

  // Derived calculations
  inpatientDirectCareMinutesPerDay: number;
  homeProjectedDirectCareHoursPerDay: number;
  requiresTwoPersonTransfers: boolean;
  clinicalDischargeNotes?: string;
}

