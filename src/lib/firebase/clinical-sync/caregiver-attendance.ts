import {
  collection, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from '../client';
import { currentUid } from './internal';

export type AttendanceStatus = 'off_duty' | 'at_home' | 'temporarily_away';
export type AttendanceEventType = 'arrived' | 'left_temporarily' | 'returned' | 'departed';
export interface HomePoint { latitude: number; longitude: number; radiusMeters: number; updatedAt?: string }
export interface AttendanceState {
  status: AttendanceStatus;
  caregiverUid: string;
  caregiverName: string;
  shiftStartedAt?: string;
  statusChangedAt?: string;
  lastEvent?: AttendanceEventType;
  distanceMeters?: number;
  accuracyMeters?: number;
}

function refs(patientUid: string) {
  if (!db) throw new Error('Cloud attendance is unavailable. Sign in and connect to the service.');
  return { current: doc(db, 'users', patientUid, 'caregiverAttendance', 'current'), events: collection(db, 'users', patientUid, 'caregiverAttendance', 'events') };
}

export async function saveHomePoint(point: HomePoint): Promise<void> {
  const uid = currentUid();
  if (!uid) throw new Error('Sign in to save the home location.');
  await setDoc(doc(db!, 'users', uid, 'homeLocation', 'current'), { ...point, updatedAt: new Date().toISOString() });
}

export async function getHomePoint(patientUid: string): Promise<HomePoint | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'homeLocation', 'current'));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null;
    return { latitude: data.latitude, longitude: data.longitude, radiusMeters: typeof data.radiusMeters === 'number' ? data.radiusMeters : 150, updatedAt: data.updatedAt };
  } catch { return null; }
}

export async function recordAttendanceEvent(patientUid: string, args: {
  type: AttendanceEventType; caregiverName: string; distanceMeters: number; accuracyMeters: number; note?: string;
}): Promise<void> {
  const uid = currentUid();
  if (!uid) throw new Error('Sign in to record attendance.');
  const { current, events } = refs(patientUid);
  const now = new Date().toISOString();
  const status: AttendanceStatus = args.type === 'arrived' || args.type === 'returned' ? 'at_home' : args.type === 'left_temporarily' ? 'temporarily_away' : 'off_duty';
  const eventRef = doc(events);
  await runTransaction(db!, async (transaction) => {
    const prior = await transaction.get(current);
    const priorStart = prior.data()?.shiftStartedAt;
    const state: AttendanceState = {
      status, caregiverUid: uid, caregiverName: args.caregiverName, statusChangedAt: now,
      lastEvent: args.type, distanceMeters: Math.round(args.distanceMeters), accuracyMeters: Math.round(args.accuracyMeters),
      ...(args.type === 'arrived' ? { shiftStartedAt: now } : priorStart ? { shiftStartedAt: priorStart } : {})
    };
    transaction.set(eventRef, { ...args, caregiverUid: uid, occurredAt: now, serverRecordedAt: serverTimestamp() });
    transaction.set(current, state);
  });
}

export function subscribeToAttendance(patientUid: string, callback: (state: AttendanceState | null) => void): () => void {
  if (!db) { callback(null); return () => {}; }
  return onSnapshot(doc(db, 'users', patientUid, 'caregiverAttendance', 'current'), (snap) => callback(snap.exists() ? snap.data() as AttendanceState : null), () => callback(null));
}

export async function linkCareCircleAccountUids(patientUid: string, accountUids: string[]): Promise<void> {
  if (!db || !currentUid() || currentUid() !== patientUid) throw new Error('Only the account owner can manage family access.');
  const ref = doc(db, 'users', patientUid, 'careCircle', 'current');
  const existing = await getDoc(ref);
  await setDoc(ref, {
    members: Array.isArray(existing.data()?.members) ? existing.data()!.members : [],
    tasks: Array.isArray(existing.data()?.tasks) ? existing.data()!.tasks : [],
    memberUids: [...new Set(accountUids.filter((uid) => uid && uid !== patientUid))],
    caregiverUids: Array.isArray(existing.data()?.caregiverUids) ? existing.data()!.caregiverUids : [],
    updatedAt: new Date().toISOString()
  });
}

export async function linkCaregiverAccountUids(patientUid: string, accountUids: string[]): Promise<void> {
  if (!db || !currentUid() || currentUid() !== patientUid) throw new Error('Only the account owner can authorize caregivers.');
  const ref = doc(db, 'users', patientUid, 'careCircle', 'current');
  const existing = await getDoc(ref);
  await setDoc(ref, {
    members: Array.isArray(existing.data()?.members) ? existing.data()!.members : [],
    tasks: Array.isArray(existing.data()?.tasks) ? existing.data()!.tasks : [],
    memberUids: Array.isArray(existing.data()?.memberUids) ? existing.data()!.memberUids : [],
    caregiverUids: [...new Set(accountUids.filter((uid) => uid && uid !== patientUid))],
    updatedAt: new Date().toISOString()
  });
}
