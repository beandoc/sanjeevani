/**
 * Doctor-issued patient registration invites and the caregiver-side claim
 * flow that migrates a pre-claim `dyad_{code}` placeholder onto the
 * caregiver's real uid.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../client';
import {
  DEFAULT_CAREGIVER_ATTRIBUTES,
  type PatientDependenceProfile,
  type CaregiverAttributes
} from '@/lib/clinical/care-gap-engine';
import { HealthRepository } from '@/lib/db/health-repository';
import { currentUid, withRetry } from './internal';
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
