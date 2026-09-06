/**
 * Reassessment requests and clinician alerts, including the caregiver-respite
 * escalation raised when a Zarit score rises into (or within) the high-burden
 * range.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../client';
import { type ZaritEvaluationResult } from '@/lib/zarit-scale';
import { currentUid } from './internal';
import { getDyadInvite } from './dyad-invites';
import type { ClinicianGrant } from './access';

const RESPITE_ALERT_MIN_DELTA_PCT = 5;
const RESPITE_ALERT_MIN_SCORE_PCT = 50;

function shouldCreateCaregiverRespiteAlert(
  previous: ZaritEvaluationResult | null,
  current: ZaritEvaluationResult
): { shouldAlert: boolean; deltaPct: number; reason: string } {
  if (!previous) {
    const currentHighRisk =
      current.normalizedPercentage >= RESPITE_ALERT_MIN_SCORE_PCT ||
      current.severityBand === 'red' ||
      current.severityBand === 'critical_red' ||
      current.redFlags.length > 0;
    return {
      shouldAlert: currentHighRisk,
      deltaPct: 0,
      reason: current.redFlags.length > 0
        ? 'Latest assessment has red flags and requires caregiver respite review.'
        : 'Latest assessment is already in the high-burden range and requires caregiver respite review.'
    };
  }

  const deltaPct = Math.round((current.normalizedPercentage - previous.normalizedPercentage) * 10) / 10;
  const rose = deltaPct > 0;
  const clinicallyMeaningfulRise = deltaPct >= RESPITE_ALERT_MIN_DELTA_PCT;
  const highCurrentBurden =
    current.normalizedPercentage >= RESPITE_ALERT_MIN_SCORE_PCT ||
    current.severityBand === 'red' ||
    current.severityBand === 'critical_red' ||
    current.redFlags.length > 0;

  return {
    shouldAlert: rose && (clinicallyMeaningfulRise || highCurrentBurden),
    deltaPct,
    reason:
      current.redFlags.length > 0
        ? 'Caregiver burden increased and the latest assessment has red flags.'
        : highCurrentBurden
          ? 'Caregiver burden increased into the high-burden range.'
          : `Caregiver burden increased by ${deltaPct} percentage points.`
  };
}

async function getAlertClinicianUids(patientUid: string, fallbackClinicianUid?: string | null): Promise<string[]> {
  const uids = new Set<string>();
  if (fallbackClinicianUid) uids.add(fallbackClinicianUid);

  if (db) {
    try {
      const grants = await getDocs(collection(db, 'users', patientUid, 'clinicianGrants'));
      grants.docs.forEach((grantDoc) => {
        const data = grantDoc.data() as ClinicianGrant;
        if (!data.revokedAt) uids.add(data.clinicianUid || grantDoc.id);
      });
    } catch {
      // Fall through to dyad invite lookup below.
    }
  }

  if (patientUid.startsWith('dyad_')) {
    try {
      const invite = await getDyadInvite(patientUid.replace('dyad_', ''));
      if (invite?.clinicianUid) uids.add(invite.clinicianUid);
    } catch {
      // No-op: alerts are best-effort and local persistence already happened.
    }
  }

  return Array.from(uids);
}

export async function createCaregiverRespiteAlertsIfNeeded(
  patientUid: string,
  patientName: string,
  current: ZaritEvaluationResult,
  previousAssessments: ZaritEvaluationResult[],
  fallbackClinicianUid?: string | null
): Promise<void> {
  if (!db) return;
  const previous = previousAssessments
    .filter((item) => new Date(item.completedAt).getTime() < new Date(current.completedAt).getTime())
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ?? null;

  const alertDecision = shouldCreateCaregiverRespiteAlert(previous, current);
  if (!alertDecision.shouldAlert) return;

  const clinicianUids = await getAlertClinicianUids(patientUid, fallbackClinicianUid);
  await Promise.all(
    clinicianUids.map((clinicianUid) =>
      createReassessmentAlert(clinicianUid, {
        patientUid,
        patientName,
        previousScore: previous?.normalizedPercentage ?? current.normalizedPercentage,
        newScore: current.normalizedPercentage,
        completedAt: current.completedAt,
        alertType: 'caregiver_respite_needed',
        deltaPct: alertDecision.deltaPct,
        needsCaregiverRespite: true,
        reason: alertDecision.reason
      })
    )
  );
}

/** Clinician requests a repeat caregiver burden assessment */
export async function requestReassessment(patientUid: string): Promise<void> {
  if (!db) return;
  const clinicianUid = currentUid();
  if (!clinicianUid) throw new Error('Must be signed in as clinician to request reassessment.');
  await setDoc(doc(db, 'users', patientUid, 'reassessmentRequests', 'current'), {
    requestedAt: new Date().toISOString(),
    requestedBy: clinicianUid,
    status: 'pending'
  });
}

/** Subscribes to pending repeat assessment requests (for caregiver view) */
export function subscribeToReassessmentRequest(
  patientUid: string,
  callback: (req: { requestedAt: string; requestedBy: string; status: string } | null) => void
) {
  if (!db) return () => {};
  return onSnapshot(
    doc(db, 'users', patientUid, 'reassessmentRequests', 'current'),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as any);
      } else {
        callback(null);
      }
    },
    () => callback(null)
  );
}

/** Caregiver marks reassessment request as completed */
export async function completeReassessmentRequest(patientUid: string): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, 'users', patientUid, 'reassessmentRequests', 'current'),
    {
      status: 'completed',
      completedAt: new Date().toISOString()
    },
    { merge: true }
  );
}

/** Caregiver registers an increased burden alert to the doctor */
export async function createReassessmentAlert(
  clinicianUid: string,
  alert: {
    patientUid: string;
    patientName: string;
    previousScore: number;
    newScore: number;
    completedAt: string;
    alertType?: 'zarit_surge' | 'caregiver_respite_needed';
    deltaPct?: number;
    needsCaregiverRespite?: boolean;
    reason?: string;
  }
): Promise<void> {
  if (!db) return;
  const alertTime = new Date(alert.completedAt).getTime() || Date.now();
  const alertId = `${alert.patientUid}_${alert.alertType || 'zarit_surge'}_${alertTime}`;
  await setDoc(doc(db, 'users', clinicianUid, 'reassessmentAlerts', alertId), {
    ...alert,
    alertType: alert.alertType || 'zarit_surge',
    needsCaregiverRespite: Boolean(alert.needsCaregiverRespite),
    id: alertId,
    read: false,
    createdAt: new Date().toISOString()
  });
}

/** Clinician subscribes to caregiver increased burden alerts */
export function subscribeToReassessmentAlerts(callback: (alerts: any[]) => void) {
  const clinicianUid = currentUid();
  if (!db || !clinicianUid) return () => {};
  return onSnapshot(
    collection(db, 'users', clinicianUid, 'reassessmentAlerts'),
    (snap) => {
      const alerts = snap.docs.map((d) => d.data());
      alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(alerts);
    },
    () => callback([])
  );
}

/** Clinician dismisses/clears an increased burden alert */
export async function dismissReassessmentAlert(alertId: string): Promise<void> {
  const clinicianUid = currentUid();
  if (!db || !clinicianUid) return;
  await deleteDoc(doc(db, 'users', clinicianUid, 'reassessmentAlerts', alertId));
}
