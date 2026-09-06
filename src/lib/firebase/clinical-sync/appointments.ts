/** Scheduled appointments for a dyad. */

import {
  collection,
  doc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../client';
import { HealthRepository, type AppointmentRecord } from '@/lib/db/health-repository';
import { currentUid } from './internal';
import type { SyncResult } from './types';

/** Caregiver mirrors a scheduled or updated appointment to Firestore */
export async function syncAppointment(appointment: AppointmentRecord): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'appointments', appointment.id), appointment);
    return { queued: true };
  } catch (err) {
    console.warn('Appointment sync failed:', err);
    return { queued: false };
  }
}

/** All appointments for a dyad — the caregiver's own, or a granted clinician's. Local cache is the fallback if Firestore is unreachable. */
export async function getAppointmentsFor(patientUid: string): Promise<AppointmentRecord[]> {
  const local = currentUid() === patientUid ? HealthRepository.getAppointments() : [];
  if (!db) return local;
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'appointments'));
    const cloud = snap.docs.map((d) => d.data() as AppointmentRecord);
    const map = new Map<string, AppointmentRecord>();
    for (const a of [...local, ...cloud]) map.set(a.id, a);
    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch {
    return local;
  }
}
