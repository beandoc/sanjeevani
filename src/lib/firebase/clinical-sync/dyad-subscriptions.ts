/**
 * One composed realtime subscription over every clinical series a dyad
 * workspace renders, so a page can re-fetch on any change with one call.
 */

import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../client';

/** Subscribe to the dyad records that affect the doctor workspace. */
export function subscribeToDyadClinicalData(patientUid: string, callback: () => void) {
  if (!db) return () => {};
  const unsubscribers = [
    onSnapshot(collection(db, 'users', patientUid, 'zaritAssessments'), callback, callback),
    onSnapshot(collection(db, 'users', patientUid, 'functionScores'), callback, callback),
    onSnapshot(collection(db, 'users', patientUid, 'vitals'), callback, callback),
    onSnapshot(collection(db, 'users', patientUid, 'dailyCareLogs'), callback, callback),
    onSnapshot(collection(db, 'users', patientUid, 'appointments'), callback, callback),
    onSnapshot(doc(db, 'users', patientUid, 'caregiverAttributes', 'current'), callback, callback),
    onSnapshot(doc(db, 'users', patientUid, 'patientProfile', 'current'), callback, callback),
    onSnapshot(doc(db, 'users', patientUid, 'medications', 'current'), callback, callback),
    onSnapshot(doc(db, 'users', patientUid, 'careCircle', 'current'), callback, callback),
    onSnapshot(doc(db, 'users', patientUid, 'clinicalAuthorization', 'current'), callback, callback),
    onSnapshot(collection(db, 'users', patientUid, 'moduleProgress'), callback, callback)
  ];
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

/**
 * Watches the small set of source documents that can change a roster card.
 * Materialized cohort summaries are a performance cache, not the source of
 * truth; this lets the doctor worklist react when a remote caregiver saves a
 * home/capacity check-in instead of waiting for a browser refresh.
 */
export function subscribeToCohortClinicalData(patientUids: string[], callback: () => void) {
  const firestore = db;
  if (!firestore || patientUids.length === 0) return () => {};
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(callback, 250);
  };
  const watch = (subscribe: (next: () => void) => () => void) => {
    // Ignore each listener's initial snapshot: the dashboard already loaded
    // that state. Every later event is a genuine cross-device update.
    let initialized = false;
    return subscribe(() => {
      if (!initialized) {
        initialized = true;
        return;
      }
      schedule();
    });
  };
  const unsubscribers = patientUids.flatMap((uid) => [
    watch((next) => onSnapshot(doc(firestore, 'users', uid, 'patientProfile', 'current'), next)),
    watch((next) => onSnapshot(doc(firestore, 'users', uid, 'caregiverAttributes', 'current'), next)),
    watch((next) => onSnapshot(collection(firestore, 'users', uid, 'functionScores'), next)),
    watch((next) => onSnapshot(collection(firestore, 'users', uid, 'zaritAssessments'), next)),
    watch((next) => onSnapshot(collection(firestore, 'users', uid, 'dailyCareLogs'), next)),
    watch((next) => onSnapshot(collection(firestore, 'users', uid, 'vitals'), next))
  ]);
  return () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
