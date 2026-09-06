/**
 * Caregiver learning modules: what a clinician assigned, and how far the
 * caregiver has got through them.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../client';
import { type ModuleSectionProgress } from '@/lib/db/health-repository';
import { currentUid, withRetry, toIsoString } from './internal';
import type { SyncResult } from './types';

/**
 * Modules a clinician has explicitly assigned to a patient's caregiver, on
 * top of the automatic comorbidity-based suggestions (see
 * getTailoredModuleIds in modules-personalization.ts). Single fixed-id
 * document, same convention as patientProfile/medications.
 */
export interface AssignedModules {
  moduleIds: string[];
  assignedByUid: string;
  assignedByLabel?: string;
  assignedAt: string;
}

/** Clinician assigns/updates the module list for a granted patient's caregiver. */
export async function assignModulesFor(
  patientUid: string,
  moduleIds: string[],
  assignedByLabel?: string
): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in as a clinician to assign modules.');
  const ref = doc(db, 'users', patientUid, 'assignedModules', 'current');
  await withRetry(() =>
    setDoc(ref, {
      moduleIds,
      assignedByUid: uid,
      assignedByLabel: assignedByLabel ?? null,
      assignedAt: new Date().toISOString()
    })
  );
}

/** Reads the modules assigned to one patient's caregiver, if any. */
export async function getAssignedModulesFor(patientUid: string): Promise<AssignedModules | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'assignedModules', 'current'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { ...data, assignedAt: toIsoString(data.assignedAt) } as AssignedModules;
  } catch {
    return null;
  }
}

/**
 * Mirrors one learning module's completed-section progress to Firestore so
 * the doctor who assigned it (see assignModulesFor) can see whether the
 * caregiver actually completed it — previously the assignment loop never
 * closed: a clinician could push modules down but never see uptake.
 * Best-effort and non-blocking; called from role-context.tsx on every
 * section toggle, a high-frequency, non-critical write.
 */
export async function syncModuleProgress(
  moduleId: string,
  progress: ModuleSectionProgress
): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'moduleProgress', moduleId), progress);
    return { queued: true };
  } catch (err) {
    console.warn('Module progress sync failed:', err);
    return { queued: false };
  }
}

/** Reads one patient's synced module-completion map, keyed by moduleId. Requires ownership or an active grant. */
export async function getModuleProgressFor(
  patientUid: string
): Promise<Record<string, ModuleSectionProgress>> {
  if (!db) return {};
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'moduleProgress'));
    const map: Record<string, ModuleSectionProgress> = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data() as ModuleSectionProgress;
    });
    return map;
  } catch {
    return {};
  }
}
