/**
 * Zarit Burden Interview and Barthel/Lawton function scores — the two
 * append-only clinical series this app is built around — plus the OPD
 * encounter they attach to.
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  onSnapshot,
  query,
  limit
} from 'firebase/firestore';
import { db } from '../client';
import { type ZaritEvaluationResult } from '@/lib/zarit-scale';
import { type FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import { HealthRepository } from '@/lib/db/health-repository';
import {
  currentUid,
  withRetry,
  toIsoString,
  mergeZaritAssessments,
  mergeFunctionScores
} from './internal';
import type { SyncResult } from './types';
import { createCaregiverRespiteAlertsIfNeeded, createReassessmentAlert } from './alerts';
import { getPatientDisplayName } from './profile';

/* ------------------------------------------------------------------ *
 * Caregiver side: sync writes, durable
 * ------------------------------------------------------------------ */

/**
 * Mirrors a completed Zarit assessment to Firestore.
 * Returns `{ queued: true }` if the write was accepted (IndexedDB will
 * replay it on reconnect), `{ queued: false }` if signed out / unconfigured.
 *
 * zaritAssessments is an append-only (create-only) subcollection — past
 * records are immutable audit trail entries. Use `addDoc` instead of
 * `setDoc` so Firestore auto-assigns the document ID.
 */
export async function syncZaritAssessment(result: ZaritEvaluationResult): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'zaritAssessments'));
    const past = snap.docs
      .map((d) => d.data() as ZaritEvaluationResult)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    await addDoc(collection(db, 'users', uid, 'zaritAssessments'), {
      ...result,
      normalizedPercentage: Number(result.normalizedPercentage)
    });

    const requestDoc = await getDoc(doc(db, 'users', uid, 'reassessmentRequests', 'current'));
    if (requestDoc.exists()) {
      const req = requestDoc.data();
      if (req.status === 'pending') {
        await setDoc(
          doc(db, 'users', uid, 'reassessmentRequests', 'current'),
          { status: 'completed', completedAt: new Date().toISOString() },
          { merge: true }
        );

        if (past.length > 0) {
          const lastAssessment = past[0];
          if (result.normalizedPercentage > lastAssessment.normalizedPercentage) {
            const patientName = await getPatientDisplayName(uid);
            await createReassessmentAlert(req.requestedBy, {
              patientUid: uid,
              patientName,
              previousScore: lastAssessment.normalizedPercentage,
              newScore: result.normalizedPercentage,
              completedAt: result.completedAt
            });
          }
        }
      }
    }

    try {
      const patientName = await getPatientDisplayName(uid);
      await createCaregiverRespiteAlertsIfNeeded(uid, patientName, result, past);
    } catch (alertErr) {
      console.warn('Caregiver respite alert sync notice:', alertErr);
    }

    return { queued: true };
  } catch (err) {
    console.warn('Zarit assessment sync failed:', err);
    return { queued: false };
  }
}

/**
 * Clinician-assisted administration of the Zarit Burden Interview during an OPD
 * consultation. Writes directly to the patient's zaritAssessments subcollection.
 */
export async function recordZaritAssessmentFor(
  patientUid: string,
  result: ZaritEvaluationResult
): Promise<void> {
  const past = await getZaritAssessmentsFor(patientUid);
  const completedAt = result.completedAt || new Date().toISOString();
  const tier = result.tier || 'ZBI22';
  const totalScore = Math.round(result.totalScore ?? (result as any).rawScore ?? 0);
  const normalizedPercentage = Number(
    result.normalizedPercentage ??
      Math.round((totalScore / (tier === 'ZBI22' ? 88 : tier === 'ZBI12' ? 48 : 16)) * 100)
  );
  const zaritId = `zarit_${new Date(completedAt).getTime()}`;
  const payload: ZaritEvaluationResult = {
    ...result,
    tier,
    totalScore,
    normalizedPercentage,
    completedAt
  };
  HealthRepository.saveZaritAssessmentFor(patientUid, payload);
  if (!db) return;
  try {
    await withRetry(() => setDoc(doc(db!, 'users', patientUid, 'zaritAssessments', zaritId), payload));
    try {
      const patientName = await getPatientDisplayName(patientUid);
      await createCaregiverRespiteAlertsIfNeeded(patientUid, patientName, payload, past, currentUid());
    } catch (alertErr) {
      console.warn('Caregiver respite alert sync notice:', alertErr);
    }
  } catch (err) {
    console.warn('Record Zarit assessment failed after retries:', err);
    throw err;
  }
}

/**
 * Records a Barthel/Lawton function assessment.
 * functionScores is an append-only (create-only) subcollection.
 * Caregiver or a granted clinician may call this.
 */
export async function recordFunctionScore(
  patientUid: string,
  result: FunctionEvaluationResult
): Promise<void> {
  const recordedAt = result.recordedAt || new Date().toISOString();
  const funcId = `func_${new Date(recordedAt).getTime()}`;
  const payload: FunctionEvaluationResult = {
    ...result,
    barthelScore: Math.round(result.barthelScore ?? 0),
    lawtonScore: Math.round(result.lawtonScore ?? 0),
    recordedAt,
    encounterId: result.encounterId ?? null
  };
  HealthRepository.saveFunctionScoreFor(patientUid, payload);
  if (!db) return;
  try {
    await withRetry(() => setDoc(doc(db!, 'users', patientUid, 'functionScores', funcId), payload));
  } catch (err) {
    console.warn('Record function score failed after retries:', err);
    throw err;
  }
}

/** Records an OPD encounter anchor. */
export async function createEncounter(
  patientUid: string,
  encounter: { visitDate: string; department?: string | null; notes?: string | null }
): Promise<string> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in to record an encounter.');
  const ref = doc(collection(db, 'users', patientUid, 'encounters'));
  await withRetry(() =>
    setDoc(ref, {
      visitDate: encounter.visitDate,
      department: encounter.department ?? null,
      notes: encounter.notes ?? null,
      clinicianUid: uid,
      createdAt: serverTimestamp()
    })
  );
  return ref.id;
}

/** All Zarit assessments for one patient, newest first. Requires an active grant or ownership. */
export async function getZaritAssessmentsFor(patientUid: string): Promise<ZaritEvaluationResult[]> {
  const local = HealthRepository.getZaritAssessmentsFor(patientUid);
  if (!db) return local;
  try {
    const q = query(collection(db, 'users', patientUid, 'zaritAssessments'), limit(10));
    const snap = await getDocs(q);
    const cloud = snap.docs
      .map((d) => {
        const data = d.data();
        return { ...data, completedAt: toIsoString(data.completedAt) } as ZaritEvaluationResult;
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return mergeZaritAssessments(local, cloud);
  } catch {
    return local;
  }
}

/** All function assessments for one patient, newest first. */
export async function getFunctionScoresFor(patientUid: string): Promise<FunctionEvaluationResult[]> {
  const local = HealthRepository.getFunctionScoresFor(patientUid);
  if (!db) return local;
  try {
    const q = query(collection(db, 'users', patientUid, 'functionScores'), limit(10));
    const snap = await getDocs(q);
    const cloud = snap.docs
      .map((d) => {
        const data = d.data();
        return { ...data, recordedAt: toIsoString(data.recordedAt) } as FunctionEvaluationResult;
      })
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return mergeFunctionScores(local, cloud);
  } catch {
    return local;
  }
}

/** Live merged Zarit assessment history for one dyad, newest first. */
export function subscribeToZaritAssessmentsFor(
  patientUid: string,
  callback: (assessments: ZaritEvaluationResult[]) => void
) {
  const local = HealthRepository.getZaritAssessmentsFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    collection(db, 'users', patientUid, 'zaritAssessments'),
    (snap) => {
      const cloud = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, completedAt: toIsoString(data.completedAt) } as ZaritEvaluationResult;
      });
      callback(mergeZaritAssessments(local, cloud));
    },
    () => callback(local)
  );
}

/** Live merged Barthel/Lawton function history for one dyad, newest first. */
export function subscribeToFunctionScoresFor(
  patientUid: string,
  callback: (scores: FunctionEvaluationResult[]) => void
) {
  const local = HealthRepository.getFunctionScoresFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    collection(db, 'users', patientUid, 'functionScores'),
    (snap) => {
      const cloud = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, recordedAt: toIsoString(data.recordedAt) } as FunctionEvaluationResult;
      });
      callback(mergeFunctionScores(local, cloud));
    },
    () => callback(local)
  );
}
