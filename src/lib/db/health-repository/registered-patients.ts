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

export function removeRegisteredPatient(patientUid: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRegisteredPatients();
    const updated = existing.filter(
      (p) => p.patientUid !== patientUid && p.inviteCode !== patientUid.replace('dyad_', '')
    );
    localStorage.setItem(STORAGE_KEYS.CLINICIAN_PATIENTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error removing clinician patient:', e);
  }
}

export function getArchivedDyads(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARCHIVED_DYADS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading archived dyads:', e);
    return [];
  }
}

export function archiveDyad(patientUid: string): void {
  if (typeof window === 'undefined' || !patientUid) return;
  try {
    const existing = getArchivedDyads();
    const cleanId = patientUid.trim();
    const toAdd = new Set<string>(existing);
    toAdd.add(cleanId);
    if (cleanId.startsWith('dyad_')) {
      toAdd.add(cleanId.replace('dyad_', ''));
    } else {
      toAdd.add(`dyad_${cleanId}`);
    }

    // Also look up any matching registered patient or invite to archive its aliases
    const reg = getRegisteredPatient(cleanId);
    if (reg) {
      if (reg.patientUid) toAdd.add(reg.patientUid);
      if (reg.inviteCode) {
        toAdd.add(reg.inviteCode);
        toAdd.add(`dyad_${reg.inviteCode}`);
      }
    }
    const invites = getDyadInvites();
    for (const inv of invites) {
      if (
        inv.dyadUid === cleanId ||
        inv.inviteCode === cleanId ||
        inv.inviteCode === cleanId.replace('dyad_', '')
      ) {
        toAdd.add(inv.inviteCode);
        toAdd.add(`dyad_${inv.inviteCode}`);
        if (inv.dyadUid) toAdd.add(inv.dyadUid);
      }
    }

    // If it's a Sarojini alias, archive all known demo/seed variants so it cannot ghost back
    if (cleanId.toLowerCase().includes('sarojini') || cleanId.toUpperCase().includes('SAROJINI81')) {
      toAdd.add('demo-sarojini');
      toAdd.add('dyad_sarojini_devi');
      toAdd.add('sarojini_devi');
      toAdd.add('SAROJINI81');
      toAdd.add('dyad_SAROJINI81');
    }

    // If it's a Ramesh alias, archive all known demo/seed variants so it cannot ghost back
    if (cleanId.toLowerCase().includes('ramesh') || cleanId.toUpperCase().includes('RAMESH76')) {
      toAdd.add('demo-ramesh');
      toAdd.add('dyad_ramesh_chand');
      toAdd.add('ramesh_chand');
      toAdd.add('RAMESH76');
      toAdd.add('dyad_RAMESH76');
    }

    // If it's a Kamla alias
    if (cleanId.toLowerCase().includes('kamla')) {
      toAdd.add('demo-kamla');
      toAdd.add('kamla_gupta');
      toAdd.add('dyad_kamla_gupta');
    }

    localStorage.setItem(STORAGE_KEYS.ARCHIVED_DYADS, JSON.stringify(Array.from(toAdd)));

    // Clean up from registered patients
    removeRegisteredPatient(cleanId);
    if (cleanId.toLowerCase().includes('sarojini') || cleanId.toUpperCase().includes('SAROJINI81')) {
      removeRegisteredPatient('demo-sarojini');
      removeRegisteredPatient('dyad_sarojini_devi');
      removeRegisteredPatient('SAROJINI81');
    }
    if (cleanId.toLowerCase().includes('ramesh') || cleanId.toUpperCase().includes('RAMESH76')) {
      removeRegisteredPatient('demo-ramesh');
      removeRegisteredPatient('dyad_ramesh_chand');
      removeRegisteredPatient('RAMESH76');
    }
    if (cleanId.toLowerCase().includes('kamla')) {
      removeRegisteredPatient('demo-kamla');
      removeRegisteredPatient('kamla_gupta');
      removeRegisteredPatient('dyad_kamla_gupta');
    }

    // Clean up invites
    const rawInvites = localStorage.getItem(STORAGE_KEYS.DYAD_INVITES);
    if (rawInvites) {
      try {
        const parsedInvites = JSON.parse(rawInvites);
        if (Array.isArray(parsedInvites)) {
          const filteredInvites = parsedInvites.filter(
            (inv: unknown) => {
              const { dyadUid, inviteCode } = inv as { dyadUid?: string; inviteCode?: string };
              return !toAdd.has(dyadUid ?? '') && !toAdd.has(inviteCode ?? '');
            }
          );
          localStorage.setItem(STORAGE_KEYS.DYAD_INVITES, JSON.stringify(filteredInvites));
        }
      } catch {}
    }

    // Clean up per-dyad local stores for all aliases
    for (const alias of Array.from(toAdd)) {
      localStorage.removeItem(`${STORAGE_KEYS.PATIENT_PROFILE}_${alias}`);
      localStorage.removeItem(`${STORAGE_KEYS.CAREGIVER_ATTRIBUTES}_${alias}`);
      localStorage.removeItem(`${STORAGE_KEYS.ZARIT}_${alias}`);
      localStorage.removeItem(`${STORAGE_KEYS.VITALS}_${alias}`);
      localStorage.removeItem(`${STORAGE_KEYS.MEDICATIONS}_${alias}`);
      localStorage.removeItem(`${STORAGE_KEYS.DAILY_CARE_LOGS}_${alias}`);
    }
  } catch (e) {
    console.error(`Error archiving dyad ${patientUid}:`, e);
  }
}

export function unarchiveDyad(patientUid: string): void {
  if (typeof window === 'undefined' || !patientUid) return;
  try {
    const existing = getArchivedDyads();
    const updated = existing.filter(
      (id) => id !== patientUid && id !== `dyad_${patientUid}` && id !== patientUid.replace('dyad_', '')
    );
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_DYADS, JSON.stringify(updated));
  } catch (e) {
    console.error(`Error unarchiving dyad ${patientUid}:`, e);
  }
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

export function purgeAllDemoDyadsFromStorage(): void {
  const demoIds = [
    'demo-sarojini',
    'dyad_sarojini_devi',
    'sarojini_devi',
    'SAROJINI81',
    'dyad_SAROJINI81',
    'demo-ramesh',
    'dyad_ramesh_chand',
    'ramesh_chand',
    'RAMESH76',
    'dyad_RAMESH76',
    'demo-kamla',
    'kamla_gupta',
    'dyad_kamla_gupta'
  ];
  for (const id of demoIds) {
    archiveDyad(id);
    removeRegisteredPatient(id);
  }
}

