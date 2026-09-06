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
    onSnapshot(collection(db, 'users', patientUid, 'moduleProgress'), callback, callback)
  ];
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
