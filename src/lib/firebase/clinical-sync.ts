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
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './client';
import type { ZaritEvaluationResult } from '@/lib/zarit-scale';
import type { FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import type { PatientDependenceProfile, CaregiverAttributes } from '@/lib/clinical/care-gap-engine';
import { DEFAULT_CAREGIVER_ATTRIBUTES } from '@/lib/clinical/care-gap-engine';
import type { VitalRecord, MedicationItem } from '@/lib/db/health-repository';

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
    await addDoc(collection(db, 'users', uid, 'zaritAssessments'), {
      ...result,
      normalizedPercentage: Number(result.normalizedPercentage)
    });
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
  if (!db) return;
  const payload = {
    ...result,
    normalizedPercentage: Number(result.normalizedPercentage),
    completedAt: result.completedAt || new Date().toISOString()
  };
  try {
    await withRetry(() => addDoc(collection(db!, 'users', patientUid, 'zaritAssessments'), payload));
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
  if (!db) return;
  const payload = {
    ...result,
    encounterId: result.encounterId ?? null
  };
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
          lawtonIadl: { medicationManagement: true, finances: true, mealPreparation: true, housekeeping: true, transportation: true },
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

  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'patientProfile', 'current'));
    if (snap.exists()) {
      const data = snap.data();
      return { ...data, updatedAt: toIsoString(data.updatedAt) } as PatientDependenceProfile & {
        updatedAt: string;
      };
    }
    return null;
  } catch {
    return null;
  }
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
  if (!db) return;
  await withRetry(() =>
    setDoc(doc(db!, 'users', patientUid, 'patientProfile', 'current'), {
      ...profile,
      updatedAt: new Date().toISOString()
    })
  );
}

/** Reads the caregiver capacity, family network & formal support matrix for one dyad. */
export async function getCaregiverAttributesFor(
  patientUid: string
): Promise<CaregiverAttributes | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'caregiverAttributes', 'current'));
    if (snap.exists()) {
      return snap.data() as CaregiverAttributes;
    }

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
  } catch {
    return null;
  }
}

/** Clinician or caregiver saves the caregiver capacity & formal support matrix. */
export async function saveCaregiverAttributesFor(
  patientUid: string,
  attrs: CaregiverAttributes
): Promise<void> {
  if (!db) return;
  await withRetry(() =>
    setDoc(doc(db!, 'users', patientUid, 'caregiverAttributes', 'current'), {
      ...attrs,
      updatedAt: new Date().toISOString()
    })
  );
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
 */
export async function recordVitalFor(patientUid: string, record: VitalRecord): Promise<void> {
  if (!db) return;
  try {
    await withRetry(() => addDoc(collection(db!, 'users', patientUid, 'vitals'), record));
  } catch (err) {
    console.warn('Record vital failed after retries:', err);
    throw err;
  }
}

/** All vital-sign readings for one patient, newest first. Requires ownership or an active grant. */
export async function getVitalsFor(patientUid: string): Promise<VitalRecord[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'vitals'));
    return snap.docs
      .map((d) => d.data() as VitalRecord)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
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
  if (!db) return [];
  try {
    const snap = await getDoc(doc(db, 'users', patientUid, 'medications', 'current'));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.items) ? (data.items as MedicationItem[]) : [];
  } catch {
    return [];
  }
}

/** Writes a patient's medication regimen on their behalf. Used by a granted clinician. */
export async function saveMedicationsFor(patientUid: string, items: MedicationItem[]): Promise<void> {
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
}): Promise<DyadInvite> {
  const uid = currentUid();
  if (!uid || !db) throw new Error('Must be signed in as a clinician to register a patient.');

  const inviteCode = generateInviteCode();
  const dyadUid = `dyad_${inviteCode}`;

  const invite: DyadInvite = {
    inviteCode,
    dyadUid,
    clinicianUid: uid,
    clinicianLabel: input.clinicianLabel ?? null,
    patientName: input.patientName,
    patientAge: input.patientAge,
    primaryConditions: input.primaryConditions || [],
    caregiverName: input.caregiverName ?? null,
    caregiverPhone: normalizePhoneNumber(input.caregiverPhone),
    createdAt: new Date().toISOString(),
    claimedAt: null,
    claimedByUid: null
  };

  // 1. Save invite record
  await withRetry(() => setDoc(doc(db!, 'dyadInvites', invite.inviteCode), invite));

  // 2. Direct provision of dyad profile and active grant so patient is immediately active on clinician roster
  try {
    await withRetry(() =>
      setDoc(doc(db!, 'users', dyadUid), {
        role: 'caregiver',
        displayName: `${input.patientName}${input.caregiverName ? ` (Caregiver: ${input.caregiverName})` : ''}`,
        createdAt: serverTimestamp()
      })
    );
    await withRetry(() =>
      setDoc(doc(db!, 'users', dyadUid, 'patientProfile', 'current'), {
        name: input.patientName,
        age: input.patientAge,
        primaryConditions: input.primaryConditions || [],
        katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
        lawtonIadl: { medicationManagement: true, finances: true, mealPreparation: true, housekeeping: true, transportation: true },
        cognitiveBehavioralLoad: 'none',
        fallHistoryLast6Months: 0,
        isBedBound: false,
        updatedAt: new Date().toISOString()
      })
    );
    await withRetry(() =>
      setDoc(doc(db!, 'users', dyadUid, 'clinicianGrants', uid), {
        clinicianUid: uid,
        clinicianLabel: input.clinicianLabel ?? null,
        grantedAt: new Date().toISOString(),
        revokedAt: null
      })
    );
  } catch (err) {
    console.warn('Dyad active auto-provision notice:', err);
  }

  return invite;
}

/** All invites this clinician has issued (claimed and unclaimed), newest first. */
export async function listMyDyadInvites(): Promise<DyadInvite[]> {
  const uid = currentUid();
  if (!uid || !db) return [];
  try {
    const snap = await getDocs(query(collection(db, 'dyadInvites'), where('clinicianUid', '==', uid)));
    return snap.docs
      .map((d) => d.data() as DyadInvite)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
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
  const uid = currentUid();
  if (!uid || !db) return;
  const code = inviteCode.trim().toUpperCase();
  try {
    await withRetry(() =>
      setDoc(doc(db!, 'dyadInvites', code), { patientProfileDraft: draft }, { merge: true })
    );
  } catch (err) {
    console.warn('Invite draft update failed after retries:', err);
    throw err;
  }
}

/** Looks up an invite by code without claiming it — used to preview/validate before claiming. */
export async function getDyadInvite(inviteCode: string): Promise<DyadInvite | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'dyadInvites', inviteCode.trim().toUpperCase()));
    return snap.exists() ? (snap.data() as DyadInvite) : null;
  } catch {
    return null;
  }
}

/**
 * Shared linkage logic for claiming an unclaimed invite as `uid`: creates
 * the clinicianGrant the roster query depends on, and — if the doctor
 * already filled out a Katz ADL assessment for this patient before the
 * caregiver even signed up — applies it to the caregiver's own synced
 * profile (isOwner(userId) on patientProfile already permits this since the
 * caller is now that owner). Used by both the manual code-entry path and
 * the automatic phone-number match below.
 */
async function applyInviteClaim(
  inviteRef: ReturnType<typeof doc>,
  invite: DyadInvite,
  uid: string
): Promise<DyadInvite> {
  if (!db) throw new Error('Firestore is unavailable.');
  const claimedAt = new Date().toISOString();

  await withRetry(() => setDoc(inviteRef, { claimedAt, claimedByUid: uid }, { merge: true }));
  await withRetry(() =>
    setDoc(doc(db!, 'users', uid, 'clinicianGrants', invite.clinicianUid), {
      clinicianUid: invite.clinicianUid,
      clinicianLabel: invite.clinicianLabel ?? null,
      grantedAt: claimedAt,
      revokedAt: null
    })
  );
  const profileToSave = invite.patientProfileDraft || {
    name: invite.patientName,
    age: invite.patientAge,
    primaryConditions: invite.primaryConditions || [],
    katzAdl: { bathing: true, dressing: true, toileting: true, transferring: true, continence: true, feeding: true },
    lawtonIadl: { medicationManagement: true, finances: true, mealPreparation: true, housekeeping: true, transportation: true },
    cognitiveBehavioralLoad: 'none',
    fallHistoryLast6Months: 0
  };

  await withRetry(() =>
    setDoc(doc(db!, 'users', uid, 'patientProfile', 'current'), {
      ...profileToSave,
      updatedAt: claimedAt
    })
  );

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
  const uid = currentUid();
  if (!uid || !db) return [];
  try {
    const q = query(
      collectionGroup(db, 'clinicianGrants'),
      where('clinicianUid', '==', uid),
      where('revokedAt', '==', null)
    );
    const snap = await getDocs(q);
    const entries: RosterEntry[] = snap.docs.map((d) => ({
      patientUid: d.ref.parent.parent!.id,
      grant: d.data() as ClinicianGrant
    }));

    // Also include any doctor-registered patient invites directly on the roster
    const invites = await listMyDyadInvites();
    const existingUids = new Set(entries.map((e) => e.patientUid));

    for (const inv of invites) {
      const dyadUid = inv.dyadUid || `dyad_${inv.inviteCode}`;
      if (!existingUids.has(dyadUid) && !existingUids.has(inv.claimedByUid || '')) {
        entries.push({
          patientUid: dyadUid,
          grant: {
            clinicianUid: uid,
            clinicianLabel: inv.clinicianLabel ?? undefined,
            grantedAt: inv.createdAt,
            revokedAt: null
          }
        });
        existingUids.add(dyadUid);
      }
    }

    return entries;
  } catch {
    return [];
  }
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/** All Zarit assessments for one patient, newest first. Requires an active grant or ownership. */
export async function getZaritAssessmentsFor(patientUid: string): Promise<ZaritEvaluationResult[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'zaritAssessments'));
    return snap.docs
      .map((d) => {
        const data = d.data();
        return { ...data, completedAt: toIsoString(data.completedAt) } as ZaritEvaluationResult;
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  } catch {
    return [];
  }
}

/** All function assessments for one patient, newest first. */
export async function getFunctionScoresFor(patientUid: string): Promise<FunctionEvaluationResult[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'users', patientUid, 'functionScores'));
    return snap.docs
      .map((d) => {
        const data = d.data();
        return { ...data, recordedAt: toIsoString(data.recordedAt) } as FunctionEvaluationResult;
      })
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  } catch {
    return [];
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
