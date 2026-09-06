/** The dyad's active medication regimen, synced as one array document. */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../client';
import { HealthRepository, type MedicationItem } from '@/lib/db/health-repository';
import { currentUid, withRetry } from './internal';
import type { SyncResult } from './types';

/**
 * Mirrors the caregiver's full medication regimen to Firestore as a single
 * document (there is one active regimen per dyad, edited in place — not
 * append-only readings like vitals/Zarit).
 *
 * medications is a mutable current-state document — setDoc is correct here.
 */
export async function syncMedications(items: MedicationItem[]): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    const ref = doc(db, 'users', uid, 'medications', 'current');
    await setDoc(ref, { items, updatedAt: new Date().toISOString() });
    return { queued: true };
  } catch (err) {
    console.warn('Medications sync failed:', err);
    return { queued: false };
  }
}

/** Reads one patient's synced medication regimen. Requires ownership or an active grant. */
export async function getMedicationsFor(patientUid: string): Promise<MedicationItem[]> {
  if (!db) return HealthRepository.getMedicationsFor(patientUid);
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'medications', 'current'));
    if (!snap.exists()) return HealthRepository.getMedicationsFor(patientUid);
    const data = snap.data();
    return Array.isArray(data.items) ? (data.items as MedicationItem[]) : [];
  } catch {
    return HealthRepository.getMedicationsFor(patientUid);
  }
}

/**
 * Writes a patient's medication regimen on their behalf. Used by a granted
 * clinician. Saves to HealthRepository's local durability cache first — this
 * was previously cloud-only-with-no-fallback, so a Firestore write failure
 * (offline, misconfigured backend) would silently discard the whole edit
 * even though the caller's success toast implied it was saved.
 */
export async function saveMedicationsFor(patientUid: string, items: MedicationItem[]): Promise<void> {
  HealthRepository.saveMedicationsFor(patientUid, items);
  if (!db) return;
  await withRetry(() =>
    setDoc(doc(db!, 'users', patientUid, 'medications', 'current'), {
      items,
      updatedAt: new Date().toISOString()
    })
  );
}
