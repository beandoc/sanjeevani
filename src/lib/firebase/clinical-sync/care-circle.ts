/** The caregiver's Care Circle — helper members and coordination tasks. */

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../client';
import { type CareCircleMember, type CareCircleTask } from '@/lib/db/health-repository';
import { currentUid } from './internal';
import type { SyncResult } from './types';

/**
 * Mirrors the signed-in caregiver's Care Circle (helper members + assigned
 * coordination tasks) to Firestore as a single current-state document.
 * Previously this had NO Firestore mirror at all — a home nurse or family
 * member added to the circle, and any task assigned to them, was invisible
 * outside the one device/browser that created it.
 */
export async function syncCareCircle(
  members: CareCircleMember[],
  tasks: CareCircleTask[]
): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'careCircle', 'current'), {
      members,
      tasks,
      updatedAt: new Date().toISOString()
    });
    return { queued: true };
  } catch (err) {
    console.warn('Care circle sync failed:', err);
    return { queued: false };
  }
}

/** Reads one patient's synced Care Circle. Requires ownership or an active grant. */
export async function getCareCircleFor(
  patientUid: string
): Promise<{ members: CareCircleMember[]; tasks: CareCircleTask[] } | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'careCircle', 'current'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      members: Array.isArray(data.members) ? (data.members as CareCircleMember[]) : [],
      tasks: Array.isArray(data.tasks) ? (data.tasks as CareCircleTask[]) : []
    };
  } catch {
    return null;
  }
}

/** Live Care Circle for one patient. */
export function subscribeToCareCircleFor(
  patientUid: string,
  callback: (circle: { members: CareCircleMember[]; tasks: CareCircleTask[] } | null) => void
) {
  if (!db) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', patientUid, 'careCircle', 'current'),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data();
      callback({
        members: Array.isArray(data.members) ? (data.members as CareCircleMember[]) : [],
        tasks: Array.isArray(data.tasks) ? (data.tasks as CareCircleTask[]) : []
      });
    },
    () => callback(null)
  );
}
