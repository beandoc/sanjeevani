/**
 * Firestore sync layer for data a clinician needs to see.
 *
 * Deliberately additive, not a replacement for `HealthRepository`. The
 * existing localStorage-backed repository keeps working exactly as before —
 * no sign-in required, zero regression to the single-user experience. This
 * module writes a best-effort copy of the same data to Firestore *only when
 * a user is signed in*, because a clinician viewing from a different device
 * fundamentally cannot read another browser's localStorage — that data has
 * to live somewhere shared. Every write here is wrapped so a signed-out user
 * (or an unreachable emulator) never breaks the local-first experience that
 * already works.
 *
 * Naming note: "patientUid" below is the *caregiver's* Firebase Auth uid —
 * the elderly care recipient has no account of their own anywhere in this
 * app's data model (see the pre-existing, still-unused `careRecipients`
 * subcollection). It is the uid of the `users/{uid}` document that this
 * dyad's data — including the caregiver's own Zarit burden score — lives
 * under, i.e. "whose dyad this concerns", not literally the patient's uid.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  collectionGroup,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './client';
import type { ZaritEvaluationResult } from '@/lib/zarit-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';

function currentUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

/* ------------------------------------------------------------------ *
 * Caregiver side: sync writes, best-effort
 * ------------------------------------------------------------------ */

/** Mirrors a completed Zarit assessment to Firestore. No-op if signed out. */
export async function syncZaritAssessment(result: ZaritEvaluationResult): Promise<void> {
  const uid = currentUid();
  if (!uid) return;
  try {
    const ref = doc(collection(db, 'users', uid, 'zaritAssessments'));
    await setDoc(ref, result);
  } catch (err) {
    // Best-effort: the local save in HealthRepository already succeeded and
    // remains the source of truth for the caregiver's own device.
    console.warn('Zarit assessment sync skipped (offline or not signed in):', err);
  }
}

/** Records a Barthel/Lawton function assessment. Caregiver or a granted clinician may call this. */
export async function recordFunctionScore(
  patientUid: string,
  result: FunctionEvaluationResult
): Promise<void> {
  const ref = doc(collection(db, 'users', patientUid, 'functionScores'));
  await setDoc(ref, result);
}

/** Records an OPD encounter anchor. */
export async function createEncounter(
  patientUid: string,
  encounter: { visitDate: string; department?: string; notes?: string }
): Promise<string> {
  const uid = currentUid();
  if (!uid) throw new Error('Must be signed in to record an encounter.');
  const ref = doc(collection(db, 'users', patientUid, 'encounters'));
  await setDoc(ref, {
    ...encounter,
    clinicianUid: uid,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

/* ------------------------------------------------------------------ *
 * Consent: caregiver grants/revokes a clinician's access
 * ------------------------------------------------------------------ */

export interface ClinicianGrant {
  clinicianUid: string;
  clinicianLabel?: string;
  grantedAt: string;
  revokedAt: string | null;
}

/** Caregiver grants a clinician (by their uid, from a shared clinic code) access to this dyad. */
export async function grantClinicianAccess(clinicianUid: string, clinicianLabel?: string): Promise<void> {
  const uid = currentUid();
  if (!uid) throw new Error('Must be signed in to grant access.');
  const ref = doc(db, 'users', uid, 'clinicianGrants', clinicianUid);
  await setDoc(ref, {
    clinicianUid,
    clinicianLabel: clinicianLabel ?? null,
    grantedAt: new Date().toISOString(),
    revokedAt: null
  });
}

/** Caregiver revokes a previously granted clinician's access. */
export async function revokeClinicianAccess(clinicianUid: string): Promise<void> {
  const uid = currentUid();
  if (!uid) throw new Error('Must be signed in to revoke access.');
  const ref = doc(db, 'users', uid, 'clinicianGrants', clinicianUid);
  await setDoc(ref, { revokedAt: new Date().toISOString() }, { merge: true });
}

/** What the signed-in caregiver has shared, for display in their own consent settings. */
export async function listMyGrants(): Promise<ClinicianGrant[]> {
  const uid = currentUid();
  if (!uid) return [];
  const snap = await getDocs(collection(db, 'users', uid, 'clinicianGrants'));
  return snap.docs.map((d) => d.data() as ClinicianGrant);
}

/* ------------------------------------------------------------------ *
 * Clinician side: roster + one dyad's data
 * ------------------------------------------------------------------ */

export interface RosterEntry {
  patientUid: string;
  grant: ClinicianGrant;
}

/**
 * All active (non-revoked) dyads the signed-in clinician has been granted.
 * A collection-group query across every caregiver's clinicianGrants
 * subcollection — Firestore evaluates the security rule per matched
 * document, so this only ever returns grants this clinician is actually
 * authorized to see (see firestore.rules `hasActiveGrant`).
 */
export async function listMyRoster(): Promise<RosterEntry[]> {
  const uid = currentUid();
  if (!uid) return [];
  const q = query(
    collectionGroup(db, 'clinicianGrants'),
    where('clinicianUid', '==', uid),
    where('revokedAt', '==', null)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    // Parent of a clinicianGrants doc is users/{patientUid}/clinicianGrants/{clinicianUid}
    patientUid: d.ref.parent.parent!.id,
    grant: d.data() as ClinicianGrant
  }));
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/** All Zarit assessments for one patient, newest first. Requires an active grant or ownership. */
export async function getZaritAssessmentsFor(patientUid: string): Promise<ZaritEvaluationResult[]> {
  const snap = await getDocs(collection(db, 'users', patientUid, 'zaritAssessments'));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { ...data, completedAt: toIsoString(data.completedAt) } as ZaritEvaluationResult;
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

/** All function assessments for one patient, newest first. */
export async function getFunctionScoresFor(patientUid: string): Promise<FunctionEvaluationResult[]> {
  const snap = await getDocs(collection(db, 'users', patientUid, 'functionScores'));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { ...data, recordedAt: toIsoString(data.recordedAt) } as FunctionEvaluationResult;
    })
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

/** Basic profile info for the roster/dyad header. Falls back gracefully if the field is absent. */
export async function getPatientDisplayName(patientUid: string): Promise<string> {
  const snap = await getDoc(doc(db, 'users', patientUid));
  const data = snap.data();
  return (data?.displayName as string) || (data?.phoneNumber as string) || `Patient ${patientUid.slice(0, 6)}`;
}
