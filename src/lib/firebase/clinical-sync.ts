/**
 * Firestore sync layer for data a clinician needs to see.
 *
 * Deliberately additive, not a replacement for `HealthRepository`. The
 * existing localStorage-backed repository keeps working exactly as before —
 * no sign-in required, zero regression to the single-user experience. This
 * module writes a best-effort copy of the same data to Firestore *only when
 * a user is signed in*, because a clinician viewing from a different device
 * fundamentally cannot read another browser's localStorage — that data has
 * to live somewhere shared.
 *
 * Write durability model (changed from fire-and-forget):
 * -------------------------------------------------------
 * The caregiver sync functions (`syncZaritAssessment`, `syncVitals`,
 * `syncMedications`, `syncPatientProfile`) now return `{ queued: boolean }`
 * rather than `Promise<void>`:
 *
 *   - `queued: true`  → Firestore accepted the write (it will persist
 *     locally in IndexedDB and auto-replay to the server on reconnect even
 *     if the user goes offline a moment later).
 *   - `queued: false` → The user is not signed in, or Firestore is
 *     unconfigured. localStorage (HealthRepository) already holds the data
 *     and remains the source of truth for this device; the caller should
 *     inform the user that the record is device-only until they sign in.
 *
 * Intent-critical operations (`createEncounter`, `claimDyadInvite`,
 * `grantClinicianAccess`, `assignModulesFor`) use `withRetry` (3 attempts,
 * exponential back-off) and surface real errors rather than silently
 * dropping them — these are user-initiated, recoverable actions that must
 * not disappear.
 *
 * Naming note: "patientUid" below is the *caregiver's* Firebase Auth uid —
 * the elderly care recipient has no account of their own anywhere in this
 * app's data model (see the pre-existing, still-unused `careRecipients`
 * subcollection). It is the uid of the `users/{uid}` document that this
 * dyad's data — including the caregiver's own Zarit burden score — lives
 * under, i.e. "whose dyad this concerns", not literally the patient's uid.
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  collectionGroup,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './client';
import type { ZaritEvaluationResult } from '@/lib/zarit-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import { DEFAULT_CAREGIVER_ATTRIBUTES, type PatientDependenceProfile, type CaregiverAttributes } from '@/lib/clinical/care-gap-engine';
import {
  HealthRepository,
  type VitalRecord,
  type MedicationItem,
  type DailyCareLog,
  type CareCircleMember,
  type CareCircleTask,
  type ModuleSectionProgress,
  type EmergencyContact,
  type UserConsentPreferences,
  type AppointmentRecord
} from '@/lib/db/health-repository';

/** Result returned by the caregiver sync helpers. */
export interface SyncResult {
  /**
   * true  → write was accepted by Firestore (queued in IndexedDB and will
   *         auto-replay to the server on reconnect).
   * false → user is not signed in or Firestore is unconfigured; the record
   *         lives only in localStorage for now.
   */
  queued: boolean;
}

function currentUid(): string | null {
  try {
    return auth?.currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

/**
 * Retries an async operation up to `maxAttempts` times with exponential
 * back-off. Intended for intent-critical writes (encounters, grant changes,
 * invite claims) that must surface errors rather than silently drop.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 400
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
      }
    }
  }
  throw lastErr;
}

const RESPITE_ALERT_MIN_DELTA_PCT = 5;
const RESPITE_ALERT_MIN_SCORE_PCT = 50;

function assessmentIdentity(result: ZaritEvaluationResult): string {
  return `${result.completedAt}|${result.tier}|${result.totalScore}|${result.normalizedPercentage}`;
}

function mergeZaritAssessments(
  local: ZaritEvaluationResult[],
  cloud: ZaritEvaluationResult[]
): ZaritEvaluationResult[] {
  const byIdentity = new Map<string, ZaritEvaluationResult>();
  for (const item of [...cloud, ...local]) {
    byIdentity.set(assessmentIdentity(item), item);
  }
  return Array.from(byIdentity.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

function functionScoreIdentity(result: FunctionEvaluationResult): string {
  return `${result.recordedAt}|${result.barthelScore}|${result.lawtonScore}|${result.dependencyPercentage}`;
}

function mergeFunctionScores(
  local: FunctionEvaluationResult[],
  cloud: FunctionEvaluationResult[]
): FunctionEvaluationResult[] {
  const byIdentity = new Map<string, FunctionEvaluationResult>();
  for (const item of [...cloud, ...local]) {
    byIdentity.set(functionScoreIdentity(item), item);
  }
  return Array.from(byIdentity.values()).sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
}

function dailyCareLogIdentity(log: DailyCareLog): string {
  return log.id;
}

function mergeDailyCareLogs(local: DailyCareLog[], cloud: DailyCareLog[]): DailyCareLog[] {
  const byId = new Map<string, DailyCareLog>();
  for (const item of [...local, ...cloud]) {
    const existing = byId.get(dailyCareLogIdentity(item));
    if (!existing || new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      byId.set(dailyCareLogIdentity(item), item);
    }
  }
  return Array.from(byId.values()).sort((a, b) => {
    const dateDelta = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDelta !== 0) return dateDelta;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

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

async function createCaregiverRespiteAlertsIfNeeded(
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

/* ------------------------------------------------------------------ *
 * Caregiver side: sync writes, durable
 * ------------------------------------------------------------------ */

/**
 * Mirrors a completed Zarit assessment to Firestore.
 * Returns `{ queued: true }` if the write was accepted (IndexedDB will
 * replay it on reconnect), `{ queued: false }` if signed out / unconfigured.
 *
 * zaritAssessments is an append-only (create-only) subcollection — past
 * records are immutable audit trail entries. Use `addDoc` instead of
 * `setDoc` so Firestore auto-assigns the document ID.
 */
export async function syncZaritAssessment(result: ZaritEvaluationResult): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'zaritAssessments'));
    const past = snap.docs
      .map((d) => d.data() as ZaritEvaluationResult)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    await addDoc(collection(db, 'users', uid, 'zaritAssessments'), {
      ...result,
      normalizedPercentage: Number(result.normalizedPercentage)
    });

    const requestDoc = await getDoc(doc(db, 'users', uid, 'reassessmentRequests', 'current'));
    if (requestDoc.exists()) {
      const req = requestDoc.data();
      if (req.status === 'pending') {
        await setDoc(
          doc(db, 'users', uid, 'reassessmentRequests', 'current'),
          { status: 'completed', completedAt: new Date().toISOString() },
          { merge: true }
        );

        if (past.length > 0) {
          const lastAssessment = past[0];
          if (result.normalizedPercentage > lastAssessment.normalizedPercentage) {
            const patientName = await getPatientDisplayName(uid);
            await createReassessmentAlert(req.requestedBy, {
              patientUid: uid,
              patientName,
              previousScore: lastAssessment.normalizedPercentage,
              newScore: result.normalizedPercentage,
              completedAt: result.completedAt
            });
          }
        }
      }
    }

    try {
      const patientName = await getPatientDisplayName(uid);
      await createCaregiverRespiteAlertsIfNeeded(uid, patientName, result, past);
    } catch (alertErr) {
      console.warn('Caregiver respite alert sync notice:', alertErr);
    }

    return { queued: true };
  } catch (err) {
    console.warn('Zarit assessment sync failed:', err);
    return { queued: false };
  }
}

/**
 * Clinician-assisted administration of the Zarit Burden Interview during an OPD
 * consultation. Writes directly to the patient's zaritAssessments subcollection.
 */
export async function recordZaritAssessmentFor(
  patientUid: string,
  result: ZaritEvaluationResult
): Promise<void> {
  const past = await getZaritAssessmentsFor(patientUid);
  const payload = {
    ...result,
    normalizedPercentage: Number(result.normalizedPercentage),
    completedAt: result.completedAt || new Date().toISOString()
  };
  HealthRepository.saveZaritAssessmentFor(patientUid, payload);
  if (!db) return;
  try {
    await withRetry(() => addDoc(collection(db!, 'users', patientUid, 'zaritAssessments'), payload));
    try {
      const patientName = await getPatientDisplayName(patientUid);
      await createCaregiverRespiteAlertsIfNeeded(patientUid, patientName, payload, past, currentUid());
    } catch (alertErr) {
      console.warn('Caregiver respite alert sync notice:', alertErr);
    }
  } catch (err) {
    console.warn('Record Zarit assessment failed after retries:', err);
    throw err;
  }
}

/**
 * Records a Barthel/Lawton function assessment.
 * functionScores is an append-only (create-only) subcollection.
 * Caregiver or a granted clinician may call this.
 */
export async function recordFunctionScore(
  patientUid: string,
  result: FunctionEvaluationResult
): Promise<void> {
  const payload = {
    ...result,
    encounterId: result.encounterId ?? null
  };
  HealthRepository.saveFunctionScoreFor(patientUid, payload);
  if (!db) return;
  try {
    await withRetry(() => addDoc(collection(db!, 'users', patientUid, 'functionScores'), payload));
  } catch (err) {
    console.warn('Record function score failed after retries:', err);
    throw err;
  }
}

/**
 * Mirrors the caregiver's own patient dependence profile (Katz ADL / Lawton
 * IADL / cognitive-behavioral load) to Firestore, so a granted clinician can
 * see and — via the onboarding wizard's doctor-mode patient picker — update
 * it. `HealthRepository.getPatientProfile()`/`savePatientProfile()` remain
 * the local source of truth for the caregiver's own device; this is the
 * durable cloud copy, called explicitly at the same sites that already
 * call `syncZaritAssessment`.
 *
 * patientProfile is a mutable current-state document (single fixed-id 'current'),
 * not an audit-trail subcollection — editing in place is correct here.
 */
export async function syncPatientProfile(profile: PatientDependenceProfile): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    const ref = doc(db, 'users', uid, 'patientProfile', 'current');
    await setDoc(ref, { ...profile, updatedAt: new Date().toISOString() });
    return { queued: true };
  } catch (err) {
    console.warn('Patient profile sync failed:', err);
    return { queued: false };
  }
}

export async function getPatientProfileFor(
  patientUid: string
): Promise<(PatientDependenceProfile & { updatedAt: string }) | null> {
  const local = HealthRepository.getPatientProfileFor(patientUid);

  // Firestore is authoritative for clinician-visible per-dyad current state.
  // localStorage is only a fallback; otherwise one browser's stale cached
  // matrix/profile can mask a newer caregiver or clinician update.
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', patientUid, 'patientProfile', 'current'));
      if (snap.exists()) {
        const data = snap.data();
        return { ...data, updatedAt: toIsoString(data.updatedAt) } as PatientDependenceProfile & {
          updatedAt: string;
        };
      }
    } catch {
      // Fall through to local/invite fallback.
    }
  }

  if (local) {
    return { ...local, updatedAt: new Date().toISOString() };
  }

  if (patientUid.startsWith('dyad_')) {
    const code = patientUid.replace('dyad_', '');
    try {
      const inv = await getDyadInvite(code);
      if (inv) {
        return {
          name: inv.patientName,
          age: inv.patientAge,
          primaryConditions: inv.primaryConditions || [],
          katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
          lawtonIadl: {
            telephone: true,
            shopping: true,
            mealPreparation: true,
            housekeeping: true,
            laundry: true,
            transportation: true,
            medicationManagement: true,
            finances: true
          },
          cognitiveBehavioralLoad: 'none',
          fallHistoryLast6Months: 0,
          isBedBound: false,
          updatedAt: inv.createdAt
        };
      }
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Writes a patient's dependence profile on their behalf. Used by a granted
 * clinician (e.g. recording a fresh Katz assessment during an OPD visit via
 * the onboarding wizard's patient picker) — mirrors the `patientUid`-
 * parameterized shape of `recordFunctionScore` above, since the caller is
 * acting on a dyad that isn't their own.
 */
export async function savePatientProfileFor(
  patientUid: string,
  profile: PatientDependenceProfile
): Promise<void> {
  // Always persist locally
  HealthRepository.savePatientProfileFor(patientUid, profile);

  if (!db) return;
  try {
    await withRetry(() =>
      setDoc(doc(db!, 'users', patientUid, 'patientProfile', 'current'), {
        ...profile,
        updatedAt: new Date().toISOString()
      })
    );
  } catch (err) {
    console.warn('Patient profile cloud sync notice (local backup active):', err);
  }
}

/** Reads the caregiver capacity, family network & formal support matrix for one dyad. */
export async function getCaregiverAttributesFor(
  patientUid: string
): Promise<CaregiverAttributes | null> {
  const local = HealthRepository.getCaregiverAttributesFor(patientUid);

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', patientUid, 'caregiverAttributes', 'current'));
      if (snap.exists()) {
        return snap.data() as CaregiverAttributes;
      }
    } catch {
      // continue
    }
  }

  if (local) return local;

  if (patientUid.startsWith('dyad_')) {
    const code = patientUid.replace('dyad_', '');
    const inv = await getDyadInvite(code);
    if (inv) {
      return {
        ...DEFAULT_CAREGIVER_ATTRIBUTES,
        name: inv.caregiverName || 'Caregiver',
        kinship: 'spouse',
        coResidence: 'lives_together',
        formalSupport: {
          type: 'none',
          hoursPerDay: 0,
          handlesHeavyTransfers: false,
          handlesMedicationWoundCare: false
        }
      };
    }
  }
  return null;
}

/** Clinician or caregiver saves the caregiver capacity & formal support matrix. */
export async function saveCaregiverAttributesFor(
  patientUid: string,
  attrs: CaregiverAttributes
): Promise<void> {
  // Always persist locally
  HealthRepository.saveCaregiverAttributesFor(patientUid, attrs);

  if (!db) return;
  try {
    await withRetry(() =>
      setDoc(doc(db!, 'users', patientUid, 'caregiverAttributes', 'current'), {
        ...attrs,
        updatedAt: new Date().toISOString()
      })
    );
  } catch (err) {
    console.warn('Caregiver attributes cloud sync notice (local backup active):', err);
  }
}

/**
 * Mirrors the signed-in caregiver's own capacity and support matrix to Firestore.
 * Returns `{ queued: true }` if accepted, `{ queued: false }` if signed out.
 */
export async function syncCaregiverAttributes(attrs: CaregiverAttributes): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    const ref = doc(db, 'users', uid, 'caregiverAttributes', 'current');
    await setDoc(ref, { ...attrs, updatedAt: new Date().toISOString() });
    return { queued: true };
  } catch (err) {
    console.warn('Caregiver attributes sync failed:', err);
    return { queued: false };
  }
}

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
  HealthRepository.saveVitalFor(patientUid, record);
  if (!db) return;
  try {
    await withRetry(() => addDoc(collection(db!, 'users', patientUid, 'vitals'), record));
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

/** Records an OPD encounter anchor. */
export async function createEncounter(
  patientUid: string,
  encounter: { visitDate: string; department?: string | null; notes?: string | null }
): Promise<string> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in to record an encounter.');
  const ref = doc(collection(db, 'users', patientUid, 'encounters'));
  await withRetry(() =>
    setDoc(ref, {
      visitDate: encounter.visitDate,
      department: encounter.department ?? null,
      notes: encounter.notes ?? null,
      clinicianUid: uid,
      createdAt: serverTimestamp()
    })
  );
  return ref.id;
}

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
 * Mirrors the signed-in caregiver's emergency contact list to Firestore as a
 * single current-state document. Previously local-storage-only with no
 * cloud mirror — invisible to a granted clinician during an actual crisis
 * call, and lost if the device/browser storage was ever cleared.
 */
export async function syncEmergencyContacts(contacts: EmergencyContact[]): Promise<SyncResult> {
  HealthRepository.saveEmergencyContacts(contacts);
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'emergencyContacts', 'current'), {
      contacts,
      updatedAt: new Date().toISOString()
    });
    return { queued: true };
  } catch (err) {
    console.warn('Emergency contacts sync failed:', err);
    return { queued: false };
  }
}

/** Reads one patient's synced emergency contact list. Requires ownership or an active grant. */
export async function getEmergencyContactsFor(patientUid: string): Promise<EmergencyContact[] | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'emergencyContacts', 'current'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return Array.isArray(data.contacts) ? (data.contacts as EmergencyContact[]) : null;
  } catch {
    return null;
  }
}

/**
 * Mirrors the signed-in user's DPDP Act 2023 consent record to Firestore.
 * Owner-only in both directions (see firestore.rules) — this is a legal
 * consent artifact, not clinical data a clinician needs to see. Previously
 * local-storage-only, meaning a consent given on one device wasn't honored
 * on another and the compliance record itself lived only on-device.
 */
export async function syncConsent(consent: UserConsentPreferences): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'consent', 'current'), consent);
    return { queued: true };
  } catch (err) {
    console.warn('Consent sync failed:', err);
    return { queued: false };
  }
}

/** Reads the signed-in user's synced consent record, if any. */
export async function getConsentForCurrentUser(): Promise<UserConsentPreferences | null> {
  const uid = currentUid();
  if (!uid || !db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'consent', 'current'));
    return snap.exists() ? (snap.data() as UserConsentPreferences) : null;
  } catch {
    return null;
  }
}

/**
 * Mirrors an in-progress form draft (a partially-filled vitals entry, the
 * onboarding wizard's step/answers) so it survives a lost device, not just a
 * closed tab. `draftId` is a fixed label ('vitalsDraft', 'onboardingDraft'),
 * not a generated id — each kind of draft overwrites its own single
 * document. Callers should debounce this themselves; it fires on every
 * keystroke-driven state change and there's no value writing on every one.
 */
export async function syncDraft(draftId: string, data: unknown): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid, 'drafts', draftId), {
      data,
      updatedAt: new Date().toISOString()
    });
    return { queued: true };
  } catch (err) {
    console.warn(`Draft sync failed (${draftId}):`, err);
    return { queued: false };
  }
}

/** Reads the signed-in user's synced draft of the given kind, if any. */
export async function getDraftForCurrentUser<T>(draftId: string): Promise<T | null> {
  const uid = currentUid();
  if (!uid || !db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'drafts', draftId));
    if (!snap.exists()) return null;
    const stored = snap.data();
    return (stored.data as T) ?? null;
  } catch {
    return null;
  }
}

/** Clears a signed-in user's synced draft — call on successful submit. */
export async function clearDraft(draftId: string): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'drafts', draftId));
  } catch (err) {
    console.warn(`Draft clear failed (${draftId}):`, err);
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

/**
 * Mirrors device-local UI preferences that should follow the account rather
 * than the device: which persona view is active (distinct from the
 * security-relevant `role` field on the same document — this is purely a
 * display toggle, see role-context.tsx) and whether onboarding is complete.
 * Merged into the existing `users/{uid}` doc rather than a new
 * subcollection — firestore.rules' update rule already allows adding
 * arbitrary extra fields as long as `role`/`createdAt` stay untouched.
 */
export async function syncUserPreferences(prefs: {
  preferredRole?: string;
  onboardingCompleted?: boolean;
}): Promise<SyncResult> {
  const uid = currentUid();
  if (!uid || !db) return { queued: false };
  try {
    await setDoc(doc(db, 'users', uid), prefs, { merge: true });
    return { queued: true };
  } catch (err) {
    console.warn('User preferences sync failed:', err);
    return { queued: false };
  }
}

/** Reads the signed-in user's synced UI preferences, if any. */
export async function getUserPreferencesForCurrentUser(): Promise<{
  preferredRole?: string;
  onboardingCompleted?: boolean;
} | null> {
  const uid = currentUid();
  if (!uid || !db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { preferredRole: data.preferredRole, onboardingCompleted: data.onboardingCompleted };
  } catch {
    return null;
  }
}

/**
 * On sign-in, pulls every piece of this account's cloud-synced data down
 * into the SAME local caches (HealthRepository) that essentially every page
 * in the app already reads from directly (HealthRepository.getVitals(),
 * .getMedications(), .getAppointments(), etc.) — so pages don't each need
 * their own cloud-fetch logic to see data entered on another device.
 * Firestore is treated as authoritative: cloud values win merge conflicts,
 * local values are kept only where the cloud has nothing yet (e.g. an
 * offline edit not yet replayed). Best-effort and non-blocking; failures on
 * one piece never block the others.
 */
export async function hydrateLocalCacheFromCloud(uid: string): Promise<void> {
  if (!db) return;

  try {
    await Promise.all([
      getPatientProfileFor(uid).then((profile) => {
        if (profile) HealthRepository.savePatientProfile(profile);
      }),
      getCaregiverAttributesFor(uid).then((attrs) => {
        if (attrs) HealthRepository.saveCaregiverAttributes(attrs);
      }),
      getMedicationsFor(uid).then((meds) => {
        if (meds.length > 0) HealthRepository.saveMedications(meds);
      }),
      getVitalsFor(uid).then((vitals) => {
        if (vitals.length > 0) HealthRepository.mergeVitals(vitals);
      }),
      getAppointmentsFor(uid).then((appts: AppointmentRecord[]) => {
        if (appts.length > 0) HealthRepository.mergeAppointments(appts);
      }),
      getModuleProgressFor(uid).then((map) => {
        if (Object.keys(map).length > 0) HealthRepository.mergeModuleProgress(map);
      }),
      getCareCircleFor(uid).then((circle) => {
        if (circle) {
          HealthRepository.saveCareCircleMembers(circle.members);
          HealthRepository.saveCareCircleTasks(circle.tasks);
        }
      }),
      getEmergencyContactsFor(uid).then((contacts) => {
        if (contacts) HealthRepository.saveEmergencyContacts(contacts);
      }),
      getConsentForCurrentUser().then((consent) => {
        if (consent) HealthRepository.saveConsent(consent);
      }),
      getBedsideRoutineChecklistFor(uid).then((checklist) => {
        if (Object.keys(checklist).length > 0) HealthRepository.saveBedsideRoutineChecklist(checklist);
      }),
      getDischargeMilestonesFor(uid).then((milestones) => {
        if (Object.keys(milestones).length > 0) HealthRepository.saveDischargeMilestones(milestones);
      }),
      getDocs(collection(db, 'users', uid, 'zaritAssessments')).then((snap) => {
        const cloud = snap.docs.map((d) => d.data() as ZaritEvaluationResult);
        if (cloud.length > 0) HealthRepository.mergeZaritAssessments(cloud);
      })
    ]);
  } catch (err) {
    console.warn('Cloud hydration notice (some data may be device-local until next sync):', err);
  }
}

/* ------------------------------------------------------------------ *
 * Doctor-initiated patient registration (invite codes)
 *
 * A doctor cannot create another person's login account from the client SDK
 * — account creation requires that person's own action (email/OTP). So
 * "doctor registers a new patient" is a two-step handshake: the doctor
 * pre-registers the dyad's basic intake (patient name/age/conditions,
 * caregiver name/phone) under a short invite code; the caregiver later
 * claims that code on their own first sign-in, which auto-creates the
 * clinicianGrant that would otherwise require the caregiver to separately
 * share a clinic code back to the doctor (the reverse, caregiver-initiated
 * flow in grantClinicianAccess below still works independently).
 * ------------------------------------------------------------------ */

export interface DyadInvite {
  inviteCode: string;
  dyadUid?: string;
  clinicianUid: string;
  clinicianLabel?: string | null;
  patientName: string;
  patientAge: number;
  primaryConditions: string[];
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  createdAt: string;
  claimedAt: string | null;
  claimedByUid: string | null;
  patientProfileDraft?: PatientDependenceProfile | null;
}

// Unambiguous alphabet (no 0/O/1/I) so a code is easy to read aloud or copy
// off a screen without misreads.
const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Normalizes to E.164 so it matches what Firebase phone-auth returns on
 * `cred.user.phoneNumber` (autoClaimInviteByPhone matches on exact string
 * equality). Assumes a 10-digit number with no country code is Indian —
 * matches the phone-auth flow's own "+919820012345" convention. Returns
 * null for empty input rather than undefined, so Firestore setDoc accepts it.
 */
function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

/** Doctor pre-registers a new patient/caregiver dyad and gets back a claimable invite code.
 * Immediately provisions the active dyad record so the patient is directly on the active roster.
 */
export async function createDyadInvite(input: {
  patientName: string;
  patientAge: number;
  primaryConditions: string[];
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  clinicianLabel?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
}): Promise<DyadInvite> {
  const uid = currentUid() || 'doctor-vivek-uid';

  const inviteCode = generateInviteCode();
  const dyadUid = `dyad_${inviteCode}`;

  const invite: DyadInvite = {
    inviteCode,
    dyadUid,
    clinicianUid: uid,
    clinicianLabel: input.clinicianLabel ?? 'Dr. Vivek',
    patientName: input.patientName,
    patientAge: input.patientAge,
    primaryConditions: input.primaryConditions || [],
    caregiverName: input.caregiverName ?? null,
    caregiverPhone: normalizePhoneNumber(input.caregiverPhone),
    createdAt: new Date().toISOString(),
    claimedAt: null,
    claimedByUid: null
  };

  const initialPatientProfile: PatientDependenceProfile = {
    name: input.patientName,
    age: input.patientAge,
    primaryConditions: input.primaryConditions || [],
    katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
    lawtonIadl: {
      telephone: true,
      shopping: true,
      mealPreparation: true,
      housekeeping: true,
      laundry: true,
      transportation: true,
      medicationManagement: true,
      finances: true
    },
    cognitiveBehavioralLoad: 'none',
    fallHistoryLast6Months: 0,
    isBedBound: false,
    weightKg: input.weightKg ?? undefined,
    heightCm: input.heightCm ?? undefined
  };

  const initialCaregiverAttrs: CaregiverAttributes = {
    ...DEFAULT_CAREGIVER_ATTRIBUTES,
    name: input.caregiverName || 'Primary Caregiver'
  };

  // 1. ALWAYS persist immediately to HealthRepository local storage
  HealthRepository.saveDyadInvite(invite);
  HealthRepository.saveRegisteredPatient({
    patientUid: dyadUid,
    inviteCode,
    patientName: input.patientName,
    patientAge: input.patientAge,
    primaryConditions: input.primaryConditions || [],
    caregiverName: input.caregiverName ?? null,
    caregiverPhone: normalizePhoneNumber(input.caregiverPhone),
    weightKg: input.weightKg ?? null,
    heightCm: input.heightCm ?? null,
    patientProfile: initialPatientProfile,
    caregiverAttributes: initialCaregiverAttrs,
    createdAt: invite.createdAt
  });
  HealthRepository.savePatientProfileFor(dyadUid, initialPatientProfile);
  HealthRepository.saveCaregiverAttributesFor(dyadUid, initialCaregiverAttrs);

  // 2. Best-effort direct sync to Firestore if backend is reachable
  if (db) {
    try {
      await withRetry(() => setDoc(doc(db!, 'dyadInvites', invite.inviteCode), invite));
      await withRetry(() =>
        setDoc(doc(db!, 'users', dyadUid), {
          role: 'caregiver',
          displayName: `${input.patientName}${input.caregiverName ? ` (Caregiver: ${input.caregiverName})` : ''}`,
          createdAt: serverTimestamp()
        })
      );
      await withRetry(() =>
        setDoc(doc(db!, 'users', dyadUid, 'patientProfile', 'current'), {
          ...initialPatientProfile,
          updatedAt: new Date().toISOString()
        })
      );
      await withRetry(() =>
        setDoc(doc(db!, 'users', dyadUid, 'caregiverAttributes', 'current'), {
          ...initialCaregiverAttrs,
          updatedAt: new Date().toISOString()
        })
      );
      await withRetry(() =>
        setDoc(doc(db!, 'users', dyadUid, 'clinicianGrants', uid), {
          clinicianUid: uid,
          clinicianLabel: input.clinicianLabel ?? 'Dr. Vivek',
          grantedAt: new Date().toISOString(),
          revokedAt: null
        })
      );
    } catch (cloudErr) {
      console.warn('Dyad cloud sync notice (local backup active):', cloudErr);
    }
  }

  return invite;
}

/** All invites this clinician has issued (claimed and unclaimed), newest first. */
export async function listMyDyadInvites(): Promise<DyadInvite[]> {
  const localInvites = HealthRepository.getDyadInvites();
  const uid = currentUid();
  if (!uid || !db) return localInvites;
  try {
    const snap = await getDocs(query(collection(db, 'dyadInvites'), where('clinicianUid', '==', uid)));
    const cloudInvites = snap.docs.map((d) => d.data() as DyadInvite);
    const map = new Map<string, DyadInvite>();
    for (const item of [...cloudInvites, ...localInvites]) {
      map.set(item.inviteCode, item);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return localInvites;
  }
}

/**
 * The issuing clinician attaches or updates the full ADL intake on an
 * unclaimed invite (e.g. filled out live in onboarding Step 2 right after
 * generating the code). No-ops if the caller isn't the issuing clinician or
 * the invite has already been claimed — enforced by firestore.rules, not
 * just this check.
 */
export async function updateDyadInviteDraft(
  inviteCode: string,
  draft: PatientDependenceProfile
): Promise<void> {
  const code = inviteCode.trim().toUpperCase();
  const dyadUid = `dyad_${code}`;
  HealthRepository.savePatientProfileFor(dyadUid, draft);

  const uid = currentUid();
  if (!uid || !db) return;
  try {
    await withRetry(() =>
      setDoc(doc(db!, 'dyadInvites', code), { patientProfileDraft: draft }, { merge: true })
    );
  } catch (err) {
    console.warn('Invite draft update failed after retries:', err);
  }
}

/** Looks up an invite by code without claiming it — used to preview/validate before claiming. */
export async function getDyadInvite(inviteCode: string): Promise<DyadInvite | null> {
  const code = inviteCode.trim().toUpperCase();
  const local = HealthRepository.getDyadInvite(code);
  if (local) return local;

  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'dyadInvites', code));
    return snap.exists() ? (snap.data() as DyadInvite) : null;
  } catch {
    return null;
  }
}

/**
 * Shared linkage logic for claiming an unclaimed invite as `uid`: creates
 * the clinicianGrant the roster query depends on, then migrates EVERYTHING
 * the doctor recorded against the pre-claim `dyad_{code}` pseudo-account
 * (patientProfile, caregiverAttributes, medications, vitals, Zarit/function
 * assessments, and assigned modules) onto the caregiver's real uid.
 *
 * Previously only caregiverAttributes was migrated (and patientProfile was
 * re-derived from the invite's own draft/defaults, never from the dyad's
 * *live* patientProfile document — which is what the doctor's dyad page
 * actually writes to via savePatientProfileFor). Any medications, vitals, or
 * assessments recorded pre-claim were silently orphaned: `listMyRoster()`
 * stops surfacing the `dyad_{code}` uid once a real grant supersedes it, so
 * that data became permanently unreachable from the UI on either side.
 *
 * Reading `users/dyad_{code}/...` here relies on firestore.rules' `
 * isDyadPlaceholder` read bypass — a `dyad_*` uid is pre-claim scratch space
 * behind an unguessable invite code, so any authenticated user (i.e. the
 * caregiver who just claimed it) may read it, same reasoning as `dyadInvites`
 * itself already being readable by any authenticated user.
 *
 * Used by both the manual code-entry path and the automatic phone-number
 * match below.
 */
async function applyInviteClaim(
  inviteRef: ReturnType<typeof doc>,
  invite: DyadInvite,
  uid: string
): Promise<DyadInvite> {
  if (!db) throw new Error('Firestore is unavailable.');
  const claimedAt = new Date().toISOString();
  const dyadDocId = invite.dyadUid || `dyad_${invite.inviteCode}`;

  await withRetry(() => setDoc(inviteRef, { claimedAt, claimedByUid: uid }, { merge: true }));
  await withRetry(() =>
    setDoc(doc(db!, 'users', uid, 'clinicianGrants', invite.clinicianUid), {
      clinicianUid: invite.clinicianUid,
      clinicianLabel: invite.clinicianLabel ?? null,
      grantedAt: claimedAt,
      revokedAt: null
    })
  );

  const defaultProfile = {
    name: invite.patientName,
    age: invite.patientAge,
    primaryConditions: invite.primaryConditions || [],
    katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
    lawtonIadl: {
      telephone: true,
      shopping: true,
      mealPreparation: true,
      housekeeping: true,
      laundry: true,
      transportation: true,
      medicationManagement: true,
      finances: true
    },
    cognitiveBehavioralLoad: 'none',
    fallHistoryLast6Months: 0
  };

  // patientProfile: prefer the dyad's LIVE document (what the doctor's dyad
  // workspace actually edits via savePatientProfileFor), then the invite's
  // own draft (filled out from the onboarding wizard), then bare defaults.
  let profileToSave: Record<string, unknown> = defaultProfile;
  try {
    const dyadProfileSnap = await getDoc(doc(db!, 'users', dyadDocId, 'patientProfile', 'current'));
    if (dyadProfileSnap.exists()) {
      profileToSave = dyadProfileSnap.data() as Record<string, unknown>;
    } else if (invite.patientProfileDraft) {
      profileToSave = invite.patientProfileDraft as unknown as Record<string, unknown>;
    }
  } catch (profileErr) {
    console.warn('Dyad patientProfile migration notice (using draft/defaults):', profileErr);
    if (invite.patientProfileDraft) profileToSave = invite.patientProfileDraft as unknown as Record<string, unknown>;
  }

  await withRetry(() =>
    setDoc(doc(db!, 'users', uid, 'patientProfile', 'current'), {
      ...profileToSave,
      updatedAt: claimedAt
    })
  );

  // Migrate every other pre-claim clinical record. Each is independently
  // best-effort — a failure on one (e.g. no medications were ever recorded)
  // must not block the others or the claim itself.
  try {
    const dyadAttrsSnap = await getDoc(doc(db!, 'users', dyadDocId, 'caregiverAttributes', 'current'));
    if (dyadAttrsSnap.exists()) {
      await withRetry(() =>
        setDoc(doc(db!, 'users', uid, 'caregiverAttributes', 'current'), {
          ...dyadAttrsSnap.data(),
          updatedAt: claimedAt
        })
      );
    }
  } catch (attrsErr) {
    console.warn('Dyad caregiverAttributes migration notice:', attrsErr);
  }

  try {
    const dyadMedsSnap = await getDoc(doc(db!, 'users', dyadDocId, 'medications', 'current'));
    if (dyadMedsSnap.exists()) {
      const items = dyadMedsSnap.data().items;
      await withRetry(() =>
        setDoc(doc(db!, 'users', uid, 'medications', 'current'), {
          items: Array.isArray(items) ? items : [],
          updatedAt: claimedAt
        })
      );
    }
  } catch (medsErr) {
    console.warn('Dyad medications migration notice:', medsErr);
  }

  try {
    const dyadModulesSnap = await getDoc(doc(db!, 'users', dyadDocId, 'assignedModules', 'current'));
    if (dyadModulesSnap.exists()) {
      await withRetry(() => setDoc(doc(db!, 'users', uid, 'assignedModules', 'current'), dyadModulesSnap.data()));
    }
  } catch (modulesErr) {
    console.warn('Dyad assignedModules migration notice:', modulesErr);
  }

  for (const subcollection of ['vitals', 'zaritAssessments', 'functionScores'] as const) {
    try {
      const dyadDocs = await getDocs(collection(db!, 'users', dyadDocId, subcollection));
      await Promise.all(
        dyadDocs.docs.map((d) => withRetry(() => setDoc(doc(db!, 'users', uid, subcollection, d.id), d.data())))
      );
    } catch (subErr) {
      console.warn(`Dyad ${subcollection} migration notice:`, subErr);
    }
  }

  return { ...invite, claimedAt, claimedByUid: uid };
}

/**
 * Caregiver claims a doctor-issued invite code manually — the fallback path
 * for when automatic phone matching (below) doesn't apply, e.g. the
 * caregiver signs in with a different number than the doctor recorded, or
 * via email. The caller is responsible for seeding local onboarding state
 * (patient name/age/conditions) from the returned invite.
 */
export async function claimDyadInvite(inviteCode: string): Promise<DyadInvite> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in to claim an invite code.');

  const code = inviteCode.trim().toUpperCase();
  const ref = doc(db, 'dyadInvites', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Invite code not found. Check the code and try again.');
  const invite = snap.data() as DyadInvite;
  if (invite.claimedAt) throw new Error('This invite code has already been used.');

  return applyInviteClaim(ref, invite, uid);
}

/**
 * Automatic linking, no code required: if a doctor registered a patient with
 * this exact phone number, and this is that caregiver's first sign-in with
 * that same number, link them immediately — no manual code entry at all.
 * Called right after phone-OTP verification (see verifyCaregiverOtp in
 * auth.ts). Best-effort: most sign-ins won't match any invite, and the
 * manual "Have an invite code?" entry (claimDyadInvite above) still exists
 * as a fallback for a mismatched number or an email sign-in.
 */
export async function autoClaimInviteByPhone(phoneNumber: string | null): Promise<DyadInvite | null> {
  const uid = currentUid();
  if (!uid || !db || !phoneNumber) return null;
  try {
    const rawDigits = phoneNumber.replace(/\D/g, '');
    const variants = Array.from(
      new Set([
        phoneNumber,
        `+${rawDigits}`,
        `+91${rawDigits.slice(-10)}`,
        rawDigits.slice(-10),
        rawDigits
      ])
    ).filter(Boolean);

    const q = query(
      collection(db, 'dyadInvites'),
      where('caregiverPhone', 'in', variants),
      where('claimedAt', '==', null)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const matched = snap.docs[0];
    return await applyInviteClaim(matched.ref, matched.data() as DyadInvite, uid);
  } catch (err) {
    console.warn('Auto-claim by phone skipped:', err);
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Consent: caregiver grants/revokes a clinician's access
 * ------------------------------------------------------------------ */

export interface ClinicianGrant {
  clinicianUid: string;
  clinicianLabel?: string;
  grantedAt: string;
  revokedAt: string | null;
}

/** Caregiver grants a clinician (by their uid, from a shared clinic code) access to this dyad. */
export async function grantClinicianAccess(clinicianUid: string, clinicianLabel?: string): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in to grant access.');
  const ref = doc(db, 'users', uid, 'clinicianGrants', clinicianUid);
  await withRetry(() =>
    setDoc(ref, {
      clinicianUid,
      clinicianLabel: clinicianLabel ?? null,
      grantedAt: new Date().toISOString(),
      revokedAt: null
    })
  );
}

/** Caregiver revokes a previously granted clinician's access. */
export async function revokeClinicianAccess(clinicianUid: string): Promise<void> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in to revoke access.');
  const ref = doc(db, 'users', uid, 'clinicianGrants', clinicianUid);
  await withRetry(() => setDoc(ref, { revokedAt: new Date().toISOString() }, { merge: true }));
}

/** What the signed-in caregiver has shared, for display in their own consent settings. */
export async function listMyGrants(): Promise<ClinicianGrant[]> {
  const uid = currentUid();
  if (!uid || !db) return [];
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'clinicianGrants'));
    return snap.docs.map((d) => d.data() as ClinicianGrant);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Clinician side: roster + one dyad's data
 * ------------------------------------------------------------------ */

export interface RosterEntry {
  patientUid: string;
  grant: ClinicianGrant;
}

/**
 * All active (non-revoked) dyads the signed-in clinician has been granted.
 * A collection-group query across every caregiver's clinicianGrants
 * subcollection — Firestore evaluates the security rule per matched
 * document, so this only ever returns grants this clinician is actually
 * authorized to see (see firestore.rules `hasActiveGrant`).
 */
export async function listMyRoster(): Promise<RosterEntry[]> {
  const uid = currentUid() || 'doctor-vivek-uid';
  const entries: RosterEntry[] = [];
  const existingUids = new Set<string>();

  // 1. Cloud collection-group grants if Firestore is connected
  if (db && uid) {
    try {
      const q = query(
        collectionGroup(db, 'clinicianGrants'),
        where('clinicianUid', '==', uid),
        where('revokedAt', '==', null)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const pUid = d.ref.parent.parent!.id;
        entries.push({
          patientUid: pUid,
          grant: d.data() as ClinicianGrant
        });
        existingUids.add(pUid);
      }
    } catch {
      // continue to local entries
    }
  }

  // 2. All dyad invites issued by clinician (cloud + local)
  const invites = await listMyDyadInvites();
  for (const inv of invites) {
    const dyadUid = inv.dyadUid || `dyad_${inv.inviteCode}`;
    if (!existingUids.has(dyadUid) && !existingUids.has(inv.claimedByUid || '')) {
      entries.push({
        patientUid: dyadUid,
        grant: {
          clinicianUid: uid,
          clinicianLabel: inv.clinicianLabel ?? 'Dr. Vivek',
          grantedAt: inv.createdAt,
          revokedAt: null
        }
      });
      existingUids.add(dyadUid);
    }
  }

  // 3. All registered patients in HealthRepository
  const localPatients = HealthRepository.getRegisteredPatients();
  for (const lp of localPatients) {
    const dyadUid = lp.patientUid;
    if (!existingUids.has(dyadUid)) {
      entries.push({
        patientUid: dyadUid,
        grant: {
          clinicianUid: uid,
          clinicianLabel: 'Dr. Vivek',
          grantedAt: lp.createdAt,
          revokedAt: null
        }
      });
      existingUids.add(dyadUid);
    }
  }

  return entries;
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/** All Zarit assessments for one patient, newest first. Requires an active grant or ownership. */
export async function getZaritAssessmentsFor(patientUid: string): Promise<ZaritEvaluationResult[]> {
  const local = HealthRepository.getZaritAssessmentsFor(patientUid);
  if (!db) return local;
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'zaritAssessments'));
    const cloud = snap.docs
      .map((d) => {
        const data = d.data();
        return { ...data, completedAt: toIsoString(data.completedAt) } as ZaritEvaluationResult;
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return mergeZaritAssessments(local, cloud);
  } catch {
    return local;
  }
}

/** All function assessments for one patient, newest first. */
export async function getFunctionScoresFor(patientUid: string): Promise<FunctionEvaluationResult[]> {
  const local = HealthRepository.getFunctionScoresFor(patientUid);
  if (!db) return local;
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'functionScores'));
    const cloud = snap.docs
      .map((d) => {
        const data = d.data();
        return { ...data, recordedAt: toIsoString(data.recordedAt) } as FunctionEvaluationResult;
      })
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return mergeFunctionScores(local, cloud);
  } catch {
    return local;
  }
}

export async function getPatientDisplayName(patientUid: string): Promise<string> {
  if (patientUid.startsWith('dyad_')) {
    const code = patientUid.replace('dyad_', '');
    try {
      const inv = await getDyadInvite(code);
      if (inv?.patientName) {
        return `${inv.patientName}${inv.patientAge ? ` (${inv.patientAge} yrs)` : ''}`;
      }
    } catch {
      // continue
    }
  }

  try {
    const profile = await getPatientProfileFor(patientUid);
    if (profile?.name) {
      return `${profile.name}${profile.age ? ` (${profile.age} yrs)` : ''}`;
    }
  } catch {
    // continue
  }

  if (!db) return `Patient ${patientUid.replace('dyad_', '')}`;

  try {
    const snap = await getDoc(doc(db, 'users', patientUid));
    const data = snap.data();
    if (data?.displayName) return data.displayName;
    return (data?.phoneNumber as string) || `Patient ${patientUid.replace('dyad_', '')}`;
  } catch {
    return `Patient ${patientUid.replace('dyad_', '')}`;
  }
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

/** Live merged Zarit assessment history for one dyad, newest first. */
export function subscribeToZaritAssessmentsFor(
  patientUid: string,
  callback: (assessments: ZaritEvaluationResult[]) => void
) {
  const local = HealthRepository.getZaritAssessmentsFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    collection(db, 'users', patientUid, 'zaritAssessments'),
    (snap) => {
      const cloud = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, completedAt: toIsoString(data.completedAt) } as ZaritEvaluationResult;
      });
      callback(mergeZaritAssessments(local, cloud));
    },
    () => callback(local)
  );
}

/** Live merged Barthel/Lawton function history for one dyad, newest first. */
export function subscribeToFunctionScoresFor(
  patientUid: string,
  callback: (scores: FunctionEvaluationResult[]) => void
) {
  const local = HealthRepository.getFunctionScoresFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    collection(db, 'users', patientUid, 'functionScores'),
    (snap) => {
      const cloud = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, recordedAt: toIsoString(data.recordedAt) } as FunctionEvaluationResult;
      });
      callback(mergeFunctionScores(local, cloud));
    },
    () => callback(local)
  );
}

/** Live current caregiver support matrix for one dyad. */
export function subscribeToCaregiverAttributesFor(
  patientUid: string,
  callback: (attrs: CaregiverAttributes | null) => void
) {
  const local = HealthRepository.getCaregiverAttributesFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', patientUid, 'caregiverAttributes', 'current'),
    (snap) => callback(snap.exists() ? (snap.data() as CaregiverAttributes) : local),
    () => callback(local)
  );
}

/** Live current patient dependence profile for one dyad. */
export function subscribeToPatientProfileFor(
  patientUid: string,
  callback: (profile: (PatientDependenceProfile & { updatedAt?: string }) | null) => void
) {
  const local = HealthRepository.getPatientProfileFor(patientUid);
  if (!db) {
    callback(local);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'users', patientUid, 'patientProfile', 'current'),
    (snap) => {
      if (!snap.exists()) {
        callback(local);
        return;
      }
      const data = snap.data();
      callback({ ...data, updatedAt: toIsoString(data.updatedAt) } as PatientDependenceProfile & {
        updatedAt: string;
      });
    },
    () => callback(local)
  );
}

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
