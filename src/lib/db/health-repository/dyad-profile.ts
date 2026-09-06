/**
 * This device's own dyad: the caregiver's attributes, the patient's
 * dependence profile, and the cached care-gap evaluation.
 */

import { STORAGE_KEYS } from './storage-keys';
import {
  CaregiverAttributes,
  LawtonIadlProfile,
  PatientDependenceProfile,
  CareGapEvaluationResult,
  CareGapEngine,
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE
} from '@/lib/clinical/care-gap-engine';
// --- 9. Caregiver Dyad Profiling & Care Gap Estimation ---

export function getCaregiverAttributes(): CaregiverAttributes {
  if (typeof window === 'undefined') return DEFAULT_CAREGIVER_ATTRIBUTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAREGIVER_ATTRIBUTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_CAREGIVER_ATTRIBUTES,
          ...parsed,
          caregiverHealth: { ...DEFAULT_CAREGIVER_ATTRIBUTES.caregiverHealth, ...(parsed.caregiverHealth || {}) },
          formalSupport: { ...DEFAULT_CAREGIVER_ATTRIBUTES.formalSupport, ...(parsed.formalSupport || {}) }
        };
      }
    }
  } catch (e) {
    console.error('Error reading caregiver attributes:', e);
  }
  return DEFAULT_CAREGIVER_ATTRIBUTES;
}

export function hasStoredCaregiverAttributes(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.CAREGIVER_ATTRIBUTES));
  } catch {
    return false;
  }
}

export function saveCaregiverAttributes(attrs: CaregiverAttributes): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CAREGIVER_ATTRIBUTES, JSON.stringify(attrs));
  } catch (e) {
    console.error('Error saving caregiver attributes:', e);
  }
}

export function getPatientProfile(): PatientDependenceProfile {
  if (typeof window === 'undefined') return DEFAULT_PATIENT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const rawIadl = parsed.lawtonIadl || {};
        const migratedIadl: LawtonIadlProfile = {
          telephone: typeof rawIadl.telephone === 'boolean' ? rawIadl.telephone : true,
          shopping: typeof rawIadl.shopping === 'boolean' ? rawIadl.shopping : true,
          mealPreparation: typeof rawIadl.mealPreparation === 'boolean' ? rawIadl.mealPreparation : true,
          housekeeping: typeof rawIadl.housekeeping === 'boolean' ? rawIadl.housekeeping : true,
          laundry: typeof rawIadl.laundry === 'boolean' ? rawIadl.laundry : true,
          transportation: typeof rawIadl.transportation === 'boolean' ? rawIadl.transportation : true,
          medicationManagement: typeof rawIadl.medicationManagement === 'boolean' ? rawIadl.medicationManagement : true,
          finances: typeof rawIadl.finances === 'boolean' ? rawIadl.finances : true
        };
        return {
          ...DEFAULT_PATIENT_PROFILE,
          ...parsed,
          homeCareAddress:
            typeof parsed.homeCareAddress === 'string'
              ? parsed.homeCareAddress
              : DEFAULT_PATIENT_PROFILE.homeCareAddress,
          katzAdl: { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(parsed.katzAdl || {}) },
          lawtonIadl: migratedIadl
        };
      }
    }
  } catch (e) {
    console.error('Error reading patient profile:', e);
  }
  return DEFAULT_PATIENT_PROFILE;
}

export function hasStoredPatientProfile(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILE));
  } catch {
    return false;
  }
}

export function hasStoredDyadProfile(): boolean {
  return hasStoredCaregiverAttributes() && hasStoredPatientProfile();
}

export function savePatientProfile(prof: PatientDependenceProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(prof));
  } catch (e) {
    console.error('Error saving patient profile:', e);
  }
}

export function getCareGapEvaluation(): CareGapEvaluationResult {
  const caregiver = getCaregiverAttributes();
  const patient = getPatientProfile();
  const result = CareGapEngine.evaluate(caregiver, patient);
  saveCareGapEvaluation(result);
  return result;
}

let memoryEvaluationStore: CareGapEvaluationResult | null = null;

export function saveCareGapEvaluation(evaluation: CareGapEvaluationResult): void {
  memoryEvaluationStore = evaluation;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CARE_GAP_EVALUATION, JSON.stringify(evaluation));
  } catch (e) {
    console.error('Error saving care gap evaluation snapshot:', e);
  }
}

export function getStoredCareGapEvaluation(): CareGapEvaluationResult | null {
  if (typeof window === 'undefined') return memoryEvaluationStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARE_GAP_EVALUATION);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading stored care gap evaluation:', e);
  }
  return memoryEvaluationStore;
}
