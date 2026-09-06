/** DPDP Act 2023 data portability: full export and Right to Erasure purge. */

import { getConsent } from './consent';
import { getVitals } from './vitals';
import { getAppointments } from './appointments';
import { getModuleProgressMap } from './module-progress';
import { getZaritAssessments } from './assessments';
import { getEmergencyContacts } from './emergency-contacts';
import { getMedications } from './medications';
import { getDailyCareLogs } from './daily-care-logs';
import { getCareCircleMembers, getCareCircleTasks } from './care-circle';
import {
  getCaregiverAttributes,
  getPatientProfile,
  hasStoredDyadProfile,
  getCareGapEvaluation
} from './dyad-profile';
import type {
  UserConsentPreferences,
  VitalRecord,
  DailyCareLog,
  AppointmentRecord,
  ModuleSectionProgress,
  EmergencyContact,
  MedicationItem,
  CareCircleMember,
  CareCircleTask
} from './types';
import { STORAGE_KEYS } from './storage-keys';
import { ZaritEvaluationResult } from '@/lib/zarit-scale';
import { CaregiverAttributes, PatientDependenceProfile, CareGapEvaluationResult } from '@/lib/clinical/care-gap-engine';
// --- 10. Data Portability & Right to Erasure (DPDP Act 2023) ---

export function exportAllUserData(): {
  exportedAt: string;
  schemaVersion: string;
  jurisdiction: string;
  consent: UserConsentPreferences;
  vitals: VitalRecord[];
  appointments: AppointmentRecord[];
  moduleProgress: Record<string, ModuleSectionProgress>;
  zaritAssessments: ZaritEvaluationResult[];
  emergencyContacts: EmergencyContact[];
  medications: MedicationItem[];
  dailyCareLogs: DailyCareLog[];
  caregiverAttributes: CaregiverAttributes;
  patientProfile: PatientDependenceProfile;
  careGapEvaluation: CareGapEvaluationResult | null;
  careCircle: {
    members: CareCircleMember[];
    tasks: CareCircleTask[];
  };
} {
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 'sanjeevani-dpdp-v2',
    jurisdiction: 'India (Digital Personal Data Protection Act 2023)',
    consent: getConsent(),
    vitals: getVitals(),
    appointments: getAppointments(),
    moduleProgress: getModuleProgressMap(),
    zaritAssessments: getZaritAssessments(),
    emergencyContacts: getEmergencyContacts(),
    medications: getMedications(),
    dailyCareLogs: getDailyCareLogs(),
    caregiverAttributes: getCaregiverAttributes(),
    patientProfile: getPatientProfile(),
    careGapEvaluation: hasStoredDyadProfile() ? getCareGapEvaluation() : null,
    careCircle: {
      members: getCareCircleMembers(),
      tasks: getCareCircleTasks()
    }
  };
}

export function deleteAllUserData(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    // Also remove dynamic per-patient keys.
    const dynamicKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith(STORAGE_KEYS.PATIENT_PROFILE) ||
          k.startsWith(STORAGE_KEYS.CAREGIVER_ATTRIBUTES) ||
          k.startsWith(STORAGE_KEYS.ZARIT) ||
          k.startsWith(STORAGE_KEYS.DAILY_CARE_LOGS) ||
          k.startsWith(STORAGE_KEYS.FUNCTION_SCORES))
      ) {
        dynamicKeysToRemove.push(k);
      }
    }
    dynamicKeysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error('Error purging user health data:', e);
  }
}
