/**
 * Clinician-side records: patients registered on this device, their per-dyad
 * profiles/attributes, and the dyad invite codes issued for them.
 */

import type { RegisteredPatientRecord } from './types';
import { STORAGE_KEYS } from './storage-keys';
import { CaregiverAttributes, PatientDependenceProfile, DEFAULT_PATIENT_PROFILE } from '@/lib/clinical/care-gap-engine';
// --- 10. Clinician Registered Patients & Dyad Invites ---

export function getRegisteredPatients(): RegisteredPatientRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLINICIAN_PATIENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading clinician patients:', e);
  }
  return [];
}

export function saveRegisteredPatient(patient: RegisteredPatientRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRegisteredPatients();
    const filtered = existing.filter((p) => p.patientUid !== patient.patientUid && p.inviteCode !== patient.inviteCode);
    const updated = [patient, ...filtered];
    localStorage.setItem(STORAGE_KEYS.CLINICIAN_PATIENTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving clinician patient:', e);
  }
}

export function getRegisteredPatient(patientUid: string): RegisteredPatientRecord | null {
  const list = getRegisteredPatients();
  return list.find((p) => p.patientUid === patientUid || p.inviteCode === patientUid.replace('dyad_', '')) || null;
}

export function savePatientProfileFor(patientUid: string, profile: PatientDependenceProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.PATIENT_PROFILE}_${patientUid}`, JSON.stringify(profile));
    // Also update in registered patients list if found
    const patient = getRegisteredPatient(patientUid);
    if (patient) {
      saveRegisteredPatient({ ...patient, patientProfile: profile });
    }
  } catch (e) {
    console.error(`Error saving patient profile for ${patientUid}:`, e);
  }
}

export function getPatientProfileFor(patientUid: string): PatientDependenceProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PATIENT_PROFILE}_${patientUid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PATIENT_PROFILE,
        ...parsed,
        katzAdl: { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(parsed.katzAdl || {}) },
        lawtonIadl: { ...DEFAULT_PATIENT_PROFILE.lawtonIadl, ...(parsed.lawtonIadl || {}) }
      };
    }
    const patient = getRegisteredPatient(patientUid);
    if (patient?.patientProfile) {
      return {
        ...DEFAULT_PATIENT_PROFILE,
        ...patient.patientProfile,
        katzAdl: { ...DEFAULT_PATIENT_PROFILE.katzAdl, ...(patient.patientProfile.katzAdl || {}) },
        lawtonIadl: { ...DEFAULT_PATIENT_PROFILE.lawtonIadl, ...(patient.patientProfile.lawtonIadl || {}) }
      };
    }
  } catch (e) {
    console.error(`Error reading patient profile for ${patientUid}:`, e);
  }
  return null;
}

export function saveCaregiverAttributesFor(patientUid: string, attrs: CaregiverAttributes): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.CAREGIVER_ATTRIBUTES}_${patientUid}`, JSON.stringify(attrs));
    const patient = getRegisteredPatient(patientUid);
    if (patient) {
      saveRegisteredPatient({ ...patient, caregiverAttributes: attrs });
    }
  } catch (e) {
    console.error(`Error saving caregiver attributes for ${patientUid}:`, e);
  }
}

export function getCaregiverAttributesFor(patientUid: string): CaregiverAttributes | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CAREGIVER_ATTRIBUTES}_${patientUid}`);
    if (raw) return JSON.parse(raw);
    const patient = getRegisteredPatient(patientUid);
    if (patient?.caregiverAttributes) return patient.caregiverAttributes;
  } catch (e) {
    console.error(`Error reading caregiver attributes for ${patientUid}:`, e);
  }
  return null;
}

export function getDyadInvites(): Array<{
  inviteCode: string;
  dyadUid?: string;
  clinicianUid: string;
  patientName: string;
  patientAge: number;
  primaryConditions: string[];
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  createdAt: string;
  claimedAt: string | null;
  claimedByUid: string | null;
}> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DYAD_INVITES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading dyad invites:', e);
  }
  return [];
}

export function saveDyadInvite(invite: {
  inviteCode: string;
  dyadUid?: string;
  clinicianUid: string;
  patientName: string;
  patientAge: number;
  primaryConditions: string[];
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  createdAt: string;
  claimedAt: string | null;
  claimedByUid: string | null;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getDyadInvites();
    const filtered = existing.filter((i) => i.inviteCode !== invite.inviteCode);
    const updated = [invite, ...filtered];
    localStorage.setItem(STORAGE_KEYS.DYAD_INVITES, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving dyad invite:', e);
  }
}

export function getDyadInvite(inviteCode: string) {
  const list = getDyadInvites();
  return list.find((i) => i.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase()) || null;
}
