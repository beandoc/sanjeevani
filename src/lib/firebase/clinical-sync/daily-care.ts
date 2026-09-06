/**
 * Bedside/day-to-day nursing records: daily care sheets, nursing procedure
 * checklists, the bedside routine checklist, and post-discharge milestones.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../client';
import { HealthRepository, type DailyCareLog } from '@/lib/db/health-repository';
import { currentUid, withRetry, mergeDailyCareLogs } from './internal';
import type { SyncResult } from './types';

/**
 * Mirrors a nurse/caregiver daily bedside sheet for the signed-in dyad.
 * One document per date+shift is updated through the day.
 */
export async function syncDailyCareLog(log: DailyCareLog): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid) return { queued: false };
  const payload = {
    ...log,
    patientUid: uid,
    updatedAt: new Date().toISOString()
  };
  HealthRepository.saveDailyCareLogFor(uid, payload);
  if (!db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'dailyCareLogs', payload.id), payload);
    return { queued: true };
  } catch (err) {
    console.warn('Daily care log sync failed:', err);
    return { queued: false };
  }
}

/** Clinician/nurse records or updates a datewise bedside sheet for a dyad. */
export async function saveDailyCareLogFor(patientUid: string, log: DailyCareLog): Promise<void> {
  const payload = {
    ...log,
    patientUid,
    updatedAt: new Date().toISOString()
  };
  HealthRepository.saveDailyCareLogFor(patientUid, payload);
  if (!db) return;
  await withRetry(() => setDoc(doc(db!, 'users', patientUid, 'dailyCareLogs', payload.id), payload));
}

/** All daily bedside sheets for one patient, newest first. */
export async function getDailyCareLogsFor(patientUid: string): Promise<DailyCareLog[]> {
  const sameSignedInDyad = currentUid() === patientUid;
  const local = mergeDailyCareLogs(
    HealthRepository.getDailyCareLogsFor(patientUid),
    sameSignedInDyad ? HealthRepository.getDailyCareLogs() : []
  );
  if (!db) return local;
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'dailyCareLogs'));
    const cloud = snap.docs.map((d) => d.data() as DailyCareLog);
    return mergeDailyCareLogs(local, cloud);
  } catch {
    return local;
  }
}

/** Live daily bedside sheets for one patient, newest first. */
export function subscribeToDailyCareLogsFor(
  patientUid: string,
  callback: (logs: DailyCareLog[]) => void
) {
  const sameSignedInDyad = currentUid() === patientUid;
  const local = mergeDailyCareLogs(
    HealthRepository.getDailyCareLogsFor(patientUid),
    sameSignedInDyad ? HealthRepository.getDailyCareLogs() : []
  );
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    collection(db, 'users', patientUid, 'dailyCareLogs'),
    (snap) => callback(mergeDailyCareLogs(local, snap.docs.map((d) => d.data() as DailyCareLog))),
    () => callback(local)
  );
}

/**
 * Mirrors a shift nurse's bedside procedure checklist for one calendar date.
 * Previously this checklist was plain React state on the nurse dashboard
 * with no persistence at all — refreshing the page silently discarded it,
 * and it was never visible to the doctor or the family.
 */
export async function syncNursingProcedures(
  patientUid: string,
  date: string,
  procedures: Record<string, boolean>
): Promise<SyncResult> {
  HealthRepository.saveNursingProceduresFor(patientUid, date, procedures);
  if (!db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', patientUid, 'nursingProcedures', date), {
      date,
      procedures,
      updatedAt: new Date().toISOString()
    });
    return { queued: true };
  } catch (err) {
    console.warn('Nursing procedures sync failed:', err);
    return { queued: false };
  }
}

/** Reads one patient's bedside procedure checklist for one calendar date. */
export async function getNursingProceduresFor(patientUid: string, date: string): Promise<Record<string, boolean>> {
  const local = HealthRepository.getNursingProceduresFor(patientUid, date);
  if (!db) return local;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'nursingProcedures', date));
    if (!snap.exists()) return local;
    const data = snap.data();
    return data.procedures && typeof data.procedures === 'object' ? { ...local, ...data.procedures } : local;
  } catch {
    return local;
  }
}

/**
 * Mirrors the caregiver's/nurse's today's bedside routine checklist
 * (Domiciliary Care tab — sensory hygiene, skin checks, Q2H turns).
 * Previously bypassed HealthRepository entirely with a raw
 * localStorage.setItem call in the component and no Firestore mirror.
 */
export async function syncBedsideRoutineChecklist(completedTasks: Record<string, boolean>): Promise<SyncResult> {
  HealthRepository.saveBedsideRoutineChecklist(completedTasks);
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'bedsideRoutineChecklist', 'current'), {
      completedTasks,
      updatedAt: new Date().toISOString()
    });
    return { queued: true };
  } catch (err) {
    console.warn('Bedside routine checklist sync failed:', err);
    return { queued: false };
  }
}

/** Reads one patient's bedside routine checklist. Requires ownership or an active grant. */
export async function getBedsideRoutineChecklistFor(patientUid: string): Promise<Record<string, boolean>> {
  const local = HealthRepository.getBedsideRoutineChecklist();
  if (!db) return local;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'bedsideRoutineChecklist', 'current'));
    if (!snap.exists()) return local;
    const data = snap.data();
    return data.completedTasks && typeof data.completedTasks === 'object' ? { ...local, ...data.completedTasks } : local;
  } catch {
    return local;
  }
}

/**
 * Mirrors the caregiver's 14-day post-discharge pathway milestone checklist.
 * Previously bypassed HealthRepository entirely with no Firestore mirror —
 * a doctor following up post-discharge had no visibility into progress.
 */
export async function syncDischargeMilestones(completedMilestones: Record<string, boolean>): Promise<SyncResult> {
  HealthRepository.saveDischargeMilestones(completedMilestones);
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'dischargeMilestones', 'current'), {
      completedMilestones,
      updatedAt: new Date().toISOString()
    });
    return { queued: true };
  } catch (err) {
    console.warn('Discharge milestones sync failed:', err);
    return { queued: false };
  }
}

/** Reads one patient's discharge-pathway milestones. Requires ownership or an active grant. */
export async function getDischargeMilestonesFor(patientUid: string): Promise<Record<string, boolean>> {
  const local = HealthRepository.getDischargeMilestones();
  if (!db) return local;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'dischargeMilestones', 'current'));
    if (!snap.exists()) return local;
    const data = snap.data();
    return data.completedMilestones && typeof data.completedMilestones === 'object'
      ? { ...local, ...data.completedMilestones }
      : local;
  } catch {
    return local;
  }
}
