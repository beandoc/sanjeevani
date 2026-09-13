/**
 * Clinician-only authorization record for a dyad's home-care blueprint and emergency logistics.
 *
 * Lives at `users/{patientUid}/clinicalAuthorization/current`. Firestore rules allow only a
 * granted clinician (or a professional bootstrapping a `dyad_*` placeholder) to write it, and
 * require `authorizedByUid == request.auth.uid`. The family caregiver can read it — that is how
 * their Care Circle page learns whether the plan they are looking at is still the signed one —
 * but can never create, update or delete it.
 *
 * There is deliberately no localStorage fallback for writes: a locally cached "authorization"
 * that never reached the server is exactly the kind of state this record exists to rule out.
 */

import { doc, getDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../client';
import { withRetry } from './internal';
import {
  CLINICAL_AUTHORIZATION_HASH_VERSION,
  type ClinicalAuthorizationRecord
} from '@/lib/clinical/clinical-authorization';

function cleanForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function isRecord(data: unknown): data is ClinicalAuthorizationRecord {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.hashVersion === CLINICAL_AUTHORIZATION_HASH_VERSION &&
    typeof d.planHash === 'string' &&
    typeof d.authorizedAt === 'string' &&
    typeof d.authorizedByUid === 'string'
  );
}

export async function getClinicalAuthorizationFor(patientUid: string): Promise<ClinicalAuthorizationRecord | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'clinicalAuthorization', 'current'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return isRecord(data) ? data : null;
  } catch {
    return null;
  }
}

export interface ClinicalAuthorizationWriteResult {
  saved: boolean;
  error?: string;
}

/** Full overwrite: the record is small and every write recomputes the hashes it carries. */
export async function saveClinicalAuthorizationFor(
  patientUid: string,
  record: ClinicalAuthorizationRecord
): Promise<ClinicalAuthorizationWriteResult> {
  if (!db) return { saved: false, error: 'Cloud persistence is not configured; authorization cannot be recorded.' };
  try {
    const payload = cleanForFirestore({ ...record, updatedAt: new Date().toISOString() });
    await withRetry(() => setDoc(doc(db!, 'users', patientUid, 'clinicalAuthorization', 'current'), payload));
    return { saved: true };
  } catch (err) {
    console.error('Clinical authorization write failed:', err);
    return { saved: false, error: err instanceof Error ? err.message : 'Write rejected by server.' };
  }
}

/** Clinician revokes the authorization outright (e.g. plan withdrawn). */
export async function revokeClinicalAuthorizationFor(patientUid: string): Promise<boolean> {
  if (!db) return false;
  try {
    await withRetry(() => deleteDoc(doc(db!, 'users', patientUid, 'clinicalAuthorization', 'current')));
    return true;
  } catch (err) {
    console.error('Clinical authorization revoke failed:', err);
    return false;
  }
}

export function subscribeToClinicalAuthorizationFor(
  patientUid: string,
  callback: (record: ClinicalAuthorizationRecord | null) => void
) {
  if (!db) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', patientUid, 'clinicalAuthorization', 'current'),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data();
      callback(isRecord(data) ? data : null);
    },
    () => callback(null)
  );
}
