/**
 * Materialized Cohort Summary Document Layer
 *
 * Denormalizes and pre-computes the expensive dyad metrics into
 * `cohortSummaries/{patientUid}`. Reading the doctor's roster then becomes
 * a single query instead of an N+1 subcollection waterfall over WAN.
 */

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../client';
import type { CohortRow } from '@/lib/analytics/cohort';

export async function syncCohortSummary(
  patientUid: string,
  partial: Partial<CohortRow> & { clinicianUid?: string; riskBandOrder?: number }
): Promise<void> {
  if (!db || !patientUid || patientUid.startsWith('demo-')) return;
  try {
    const cleanId = patientUid.trim();
    const ref = doc(db, 'cohortSummaries', cleanId);
    await setDoc(
      ref,
      {
        ...partial,
        patientUid: cleanId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`Materialized cohort summary sync notice for ${patientUid}:`, err);
  }
}

export async function getCohortSummary(patientUid: string): Promise<CohortRow | null> {
  if (!db || !patientUid) return null;
  try {
    const ref = doc(db, 'cohortSummaries', patientUid.trim());
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as CohortRow) : null;
  } catch {
    return null;
  }
}

export async function deleteCohortSummary(patientUid: string): Promise<void> {
  if (!db || !patientUid) return;
  try {
    const cleanId = patientUid.trim();
    await deleteDoc(doc(db, 'cohortSummaries', cleanId));
  } catch (err) {
    console.warn(`Materialized cohort summary deletion notice for ${patientUid}:`, err);
  }
}

