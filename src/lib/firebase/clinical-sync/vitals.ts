/** Vital sign readings — an append-only clinical observation series. */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../client';
import { HealthRepository, type VitalRecord } from '@/lib/db/health-repository';
import { currentUid, withRetry } from './internal';
import type { SyncResult } from './types';

/**
 * Mirrors one vital-signs reading to Firestore.
 * vitals is an append-only (create-only) subcollection — readings are
 * immutable audit trail entries. Use `addDoc` to auto-assign document ID.
 *
 * Returns `{ queued: true }` if accepted, `{ queued: false }` if signed out.
 */
export async function syncVitals(record: VitalRecord): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await addDoc(collection(db, 'users', uid, 'vitals'), record);
    return { queued: true };
  } catch (err) {
    console.warn('Vitals sync failed:', err);
    return { queued: false };
  }
}

/**
 * Records a vital reading on a patient's behalf.
 * Used by a granted clinician (e.g. during an OPD visit).
 * vitals is create-only; uses withRetry for intent-critical writes.
 *
 * Writes to HealthRepository's local durability cache first — previously
 * this was cloud-only, so a Firestore outage lost the reading entirely with
 * no local backup, unlike its sibling record*For functions (Zarit, function
 * scores, daily care logs).
 */
export async function recordVitalFor(patientUid: string, record: VitalRecord): Promise<void> {
  const docId = record.id || `vital_${Date.now()}`;
  const payload: VitalRecord = {
    ...record,
    id: docId,
    sleep: record.sleep || 'good',
    createdAt: record.createdAt || new Date().toISOString()
  };
  HealthRepository.saveVitalFor(patientUid, payload);
  if (!db) return;
  try {
    await withRetry(() => setDoc(doc(db!, 'users', patientUid, 'vitals', docId), payload));
  } catch (err) {
    console.warn('Record vital failed after retries (saved locally):', err);
    throw err;
  }
}

/** All vital-sign readings for one patient, newest first. Requires ownership or an active grant. */
export async function getVitalsFor(patientUid: string): Promise<VitalRecord[]> {
  const local = HealthRepository.getVitalsFor(patientUid);
  if (!db) return local;
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'vitals'));
    const cloud = snap.docs.map((d) => d.data() as VitalRecord);
    const map = new Map<string, VitalRecord>();
    for (const item of [...local, ...cloud]) map.set(item.id, item);
    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return local;
  }
}
