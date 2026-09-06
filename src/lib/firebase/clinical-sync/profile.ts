/**
 * The dyad's current-state documents: the patient's dependence profile (Katz
 * ADL / Lawton IADL) and the caregiver's capacity/formal-support matrix.
 */

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db } from '../client';
import {
  DEFAULT_CAREGIVER_ATTRIBUTES,
  type PatientDependenceProfile,
  type CaregiverAttributes
} from '@/lib/clinical/care-gap-engine';
import { HealthRepository } from '@/lib/db/health-repository';
import { currentUid, withRetry, toIsoString } from './internal';
import type { SyncResult } from './types';
import { getDyadInvite } from './dyad-invites';

/**
 * Strips undefined properties recursively so Firestore writes never fail with
 * "Unsupported field value: undefined" errors.
 */
function cleanForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Mirrors the caregiver's own patient dependence profile (Katz ADL / Lawton
 * IADL / cognitive-behavioral load) to Firestore, so a granted clinician can
 * see and — via the onboarding wizard's doctor-mode patient picker — update
 * it. `HealthRepository.getPatientProfile()`/`savePatientProfile()` remain
 * the local source of truth for the caregiver's own device; this is the
 * durable cloud copy, called explicitly at the same sites that already
 * call `syncZaritAssessment`.
 *
 * patientProfile is a mutable current-state document (single fixed-id 'current'),
 * not an audit-trail subcollection — editing in place is correct here.
 */
export async function syncPatientProfile(profile: PatientDependenceProfile): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    const ref = doc(db, 'users', uid, 'patientProfile', 'current');
    await setDoc(ref, cleanForFirestore({ ...profile, updatedAt: new Date().toISOString() }));
    return { queued: true };
  } catch (err) {
    console.error('Patient profile sync failed:', err);
    return { queued: false };
  }
}

export async function getPatientProfileFor(
  patientUid: string
): Promise<(PatientDependenceProfile & { updatedAt: string }) | null> {
  const local = HealthRepository.getPatientProfileFor(patientUid);

  // Firestore is authoritative for clinician-visible per-dyad current state.
  // localStorage is only a fallback; otherwise one browser's stale cached
  // matrix/profile can mask a newer caregiver or clinician update.
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', patientUid, 'patientProfile', 'current'));
      if (snap.exists()) {
        const data = snap.data();
        return { ...data, updatedAt: toIsoString(data.updatedAt) } as PatientDependenceProfile & {
          updatedAt: string;
        };
      }
    } catch {
      // Fall through to local/invite fallback.
    }
  }

  if (local) {
    return { ...local, updatedAt: new Date().toISOString() };
  }

  if (patientUid.startsWith('dyad_')) {
    const code = patientUid.replace('dyad_', '');
    try {
      const inv = await getDyadInvite(code);
      if (inv) {
        return {
          name: inv.patientName,
          age: inv.patientAge,
          primaryConditions: inv.primaryConditions || [],
          katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
          lawtonIadl: {
            telephone: true,
            shopping: true,
            mealPreparation: true,
            housekeeping: true,
            laundry: true,
            transportation: true,
            medicationManagement: true,
            finances: true
          },
          cognitiveBehavioralLoad: 'none',
          fallHistoryLast6Months: 0,
          isBedBound: false,
          updatedAt: inv.createdAt
        };
      }
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Writes a patient's dependence profile on their behalf. Used by a granted
 * clinician (e.g. recording a fresh Katz assessment during an OPD visit via
 * the onboarding wizard's patient picker) — mirrors the `patientUid`-
 * parameterized shape of `recordFunctionScore` above, since the caller is
 * acting on a dyad that isn't their own.
 */
export async function savePatientProfileFor(
  patientUid: string,
  profile: PatientDependenceProfile
): Promise<void> {
  // Always persist locally
  HealthRepository.savePatientProfileFor(patientUid, profile);

  if (!db) return;
  try {
    const payload = cleanForFirestore({
      ...profile,
      updatedAt: new Date().toISOString()
    });
    await withRetry(() =>
      setDoc(doc(db!, 'users', patientUid, 'patientProfile', 'current'), payload)
    );
  } catch (err) {
    console.error('Patient profile cloud sync error (local backup active):', err);
  }
}

/** Reads the caregiver capacity, family network & formal support matrix for one dyad. */
export async function getCaregiverAttributesFor(
  patientUid: string
): Promise<CaregiverAttributes | null> {
  const local = HealthRepository.getCaregiverAttributesFor(patientUid);

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', patientUid, 'caregiverAttributes', 'current'));
      if (snap.exists()) {
        return snap.data() as CaregiverAttributes;
      }
    } catch {
      // continue
    }
  }

  if (local) return local;

  if (patientUid.startsWith('dyad_')) {
    const code = patientUid.replace('dyad_', '');
    const inv = await getDyadInvite(code);
    if (inv) {
      return {
        ...DEFAULT_CAREGIVER_ATTRIBUTES,
        name: inv.caregiverName || 'Caregiver',
        kinship: 'spouse',
        coResidence: 'lives_together',
        formalSupport: {
          type: 'none',
          hoursPerDay: 0,
          handlesHeavyTransfers: false,
          handlesMedicationWoundCare: false
        }
      };
    }
  }
  return null;
}

/** Clinician or caregiver saves the caregiver capacity & formal support matrix. */
/**
 * Result of a caregiver-matrix write. `conflict` means another editor (typically the treating
 * clinician and a family member working at the same time) saved a newer version of the shared
 * document; the caller should reload and re-apply rather than assume the write landed.
 */
export interface CaregiverAttributesWriteResult {
  saved: boolean;
  conflict: boolean;
  remoteUpdatedAt?: string;
}

export async function saveCaregiverAttributesFor(
  patientUid: string,
  attrs: CaregiverAttributes,
  /** `updatedAt` of the version this edit was based on, when the caller has it. */
  baseUpdatedAt?: string
): Promise<CaregiverAttributesWriteResult> {
  // Always persist locally
  HealthRepository.saveCaregiverAttributesFor(patientUid, attrs);

  if (!db) return { saved: true, conflict: false };

  const ref = doc(db, 'users', patientUid, 'caregiverAttributes', 'current');

  try {
    // The document is written as a full overwrite (removals of secondary members must
    // propagate), so a blind write is last-writer-wins: a clinician and a family member editing
    // the same dyad in the same hour silently clobbered each other. The transaction refuses to
    // overwrite a strictly newer version and reports the conflict instead.
    return await withRetry(() =>
      runTransaction(db!, async (tx) => {
        const snap = await tx.get(ref);
        const remoteUpdatedAt = snap.exists() ? (snap.data() as { updatedAt?: string }).updatedAt : undefined;

        if (baseUpdatedAt && remoteUpdatedAt && remoteUpdatedAt > baseUpdatedAt) {
          return { saved: false, conflict: true, remoteUpdatedAt };
        }

        const updatedAt = new Date().toISOString();
        const payload = cleanForFirestore({ ...attrs, updatedAt });
        tx.set(ref, payload);
        return { saved: true, conflict: false, remoteUpdatedAt: updatedAt };
      })
    );
  } catch (err) {
    console.error('Caregiver attributes cloud sync error (local backup active):', err);
    return { saved: false, conflict: false };
  }
}

/**
 * Mirrors the signed-in caregiver's own capacity and support matrix to Firestore.
 * Returns `{ queued: true }` if accepted, `{ queued: false }` if signed out.
 */
export async function syncCaregiverAttributes(attrs: CaregiverAttributes): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    const ref = doc(db, 'users', uid, 'caregiverAttributes', 'current');
    await setDoc(ref, cleanForFirestore({ ...attrs, updatedAt: new Date().toISOString() }));
    return { queued: true };
  } catch (err) {
    console.error('Caregiver attributes sync failed:', err);
    return { queued: false };
  }
}

export async function getPatientDisplayName(patientUid: string): Promise<string> {
  const reg = HealthRepository.getRegisteredPatient(patientUid);
  if (reg?.patientName) {
    return `${reg.patientName}${reg.patientAge ? ` (${reg.patientAge} yrs)` : ''}`;
  }

  if (patientUid.startsWith('dyad_')) {
    const code = patientUid.replace('dyad_', '');
    try {
      const inv = await getDyadInvite(code);
      if (inv?.patientName) {
        return `${inv.patientName}${inv.patientAge ? ` (${inv.patientAge} yrs)` : ''}`;
      }
    } catch {
      // continue
    }
  }

  try {
    const profile = await getPatientProfileFor(patientUid);
    if (profile?.name) {
      return `${profile.name}${profile.age ? ` (${profile.age} yrs)` : ''}`;
    }
  } catch {
    // continue
  }

  if (!db) return `Patient ${patientUid.replace('dyad_', '')}`;

  try {
    const snap = await getDoc(doc(db, 'users', patientUid));
    const data = snap.data();
    if (data?.displayName) return data.displayName;
    return (data?.phoneNumber as string) || `Patient ${patientUid.replace('dyad_', '')}`;
  } catch {
    return `Patient ${patientUid.replace('dyad_', '')}`;
  }
}

/** Live current caregiver support matrix for one dyad. */
export function subscribeToCaregiverAttributesFor(
  patientUid: string,
  callback: (attrs: CaregiverAttributes | null) => void
) {
  const local = HealthRepository.getCaregiverAttributesFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', patientUid, 'caregiverAttributes', 'current'),
    (snap) => callback(snap.exists() ? (snap.data() as CaregiverAttributes) : local),
    () => callback(local)
  );
}

/** Live current patient dependence profile for one dyad. */
export function subscribeToPatientProfileFor(
  patientUid: string,
  callback: (profile: (PatientDependenceProfile & { updatedAt?: string }) | null) => void
) {
  const local = HealthRepository.getPatientProfileFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', patientUid, 'patientProfile', 'current'),
    (snap) => {
      if (!snap.exists()) {
        callback(local);
        return;
      }
      const data = snap.data();
      callback({ ...data, updatedAt: toIsoString(data.updatedAt) } as PatientDependenceProfile & {
        updatedAt: string;
      });
    },
    () => callback(local)
  );
}
