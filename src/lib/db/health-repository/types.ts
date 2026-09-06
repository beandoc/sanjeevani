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
