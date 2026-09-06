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
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../client';
import {
  DEFAULT_CAREGIVER_ATTRIBUTES,
  DEFAULT_PATIENT_PROFILE,
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
  /** An auto-generated demo login (e.g. abhishekcaregiver@kutumbh.com) this
   * invite auto-claims for on first sign-in — see provisionDemoPersonaAccess
   * in ./access.ts. Independent of caregiverPhone matching. */
  caregiverEmail?: string | null;
  createdAt: string;
  claimedAt: string | null;
  claimedByUid: string | null;
  patientProfileDraft?: PatientDependenceProfile | null;
}

// Unambiguous alphabet (no 0/O/1/I) so a code is easy to read aloud or copy
// off a screen without misreads.
const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateInviteCode(): string {
  const randomBytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 8; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += INVITE_CODE_ALPHABET[randomBytes[i] % INVITE_CODE_ALPHABET.length];
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
  caregiverEmail?: string | null;
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
    caregiverEmail: input.caregiverEmail?.trim().toLowerCase() || null,
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

  // 2. Atomic sync to Firestore if backend is reachable
  if (db) {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'dyadInvites', invite.inviteCode), invite);
      batch.set(doc(db, 'users', dyadUid), {
        role: 'caregiver',
        displayName: `${input.patientName}${input.caregiverName ? ` (Caregiver: ${input.caregiverName})` : ''}`,
        createdAt: serverTimestamp()
      });
      batch.set(doc(db, 'users', dyadUid, 'patientProfile', 'current'), {
        ...initialPatientProfile,
        updatedAt: new Date().toISOString()
      });
      batch.set(doc(db, 'users', dyadUid, 'caregiverAttributes', 'current'), {
        ...initialCaregiverAttrs,
        updatedAt: new Date().toISOString()
      });
      batch.set(doc(db, 'users', dyadUid, 'clinicianGrants', uid), {
        clinicianUid: uid,
        clinicianLabel: input.clinicianLabel ?? 'Dr. Vivek',
        grantedAt: new Date().toISOString(),
        revokedAt: null
      });
      // Initial materialized cohort summary document for instant single-read loading
      batch.set(doc(db, 'cohortSummaries', dyadUid), {
        patientUid: dyadUid,
        displayName: input.patientName,
        clinicianUid: uid,
        riskBand: 'insufficient-data',
        riskBandOrder: 3,
        burdenTrendPerMonth: null,
        latestBurdenPct: null,
        hasRedFlag: false,
        hasQocWarning: false,
        conditions: input.primaryConditions || [],
        caregiverName: input.caregiverName ?? null,
        caregiverPhone: normalizePhoneNumber(input.caregiverPhone),
        updatedAt: new Date().toISOString()
      });
      await withRetry(() => batch.commit());
    } catch (cloudErr) {
      console.warn('Dyad cloud batch sync notice (local backup active):', cloudErr);
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

  let effectiveInvite: DyadInvite = invite;
  let profileToSave: Record<string, unknown> = defaultProfile;

  // Run transactional read-and-claim to prevent double-claiming race conditions
  await runTransaction(db, async (txn) => {
    const inviteSnap = await txn.get(inviteRef);
    if (!inviteSnap.exists()) {
      throw new Error('Invite code not found. Check the code and try again.');
    }
    const currentInvite = inviteSnap.data() as DyadInvite;
    if (currentInvite.claimedAt) {
      throw new Error('This invite code has already been used.');
    }
    effectiveInvite = currentInvite;
    try {
      const dyadProfileSnap = await txn.get(doc(db!, 'users', dyadDocId, 'patientProfile', 'current'));
      if (dyadProfileSnap.exists()) {
        profileToSave = dyadProfileSnap.data() as Record<string, unknown>;
      } else if (currentInvite.patientProfileDraft) {
        profileToSave = currentInvite.patientProfileDraft as unknown as Record<string, unknown>;
      }
    } catch {
      if (currentInvite.patientProfileDraft) {
        profileToSave = currentInvite.patientProfileDraft as unknown as Record<string, unknown>;
      }
    }

    txn.set(inviteRef, { claimedAt, claimedByUid: uid }, { merge: true });
    txn.set(doc(db!, 'users', uid, 'clinicianGrants', currentInvite.clinicianUid), {
      clinicianUid: currentInvite.clinicianUid,
      clinicianLabel: currentInvite.clinicianLabel ?? null,
      grantedAt: claimedAt,
      revokedAt: null
    });
    txn.set(doc(db!, 'users', uid, 'patientProfile', 'current'), {
      ...profileToSave,
      updatedAt: claimedAt
    });
  });

  // Best-effort cohort summary touch (non-blocking for caregiver client)
  try {
    await setDoc(doc(db!, 'cohortSummaries', uid), {
      patientUid: uid,
      displayName: effectiveInvite.patientName,
      clinicianUid: effectiveInvite.clinicianUid,
      updatedAt: claimedAt
    }, { merge: true });
  } catch {
    // cohortSummaries is a server/doctor view, never blocks caregiver claim
  }

  // Save immediately to local repository cache
  if (typeof window !== 'undefined') {
    HealthRepository.savePatientProfile((profileToSave as unknown) as PatientDependenceProfile);
    if (effectiveInvite.caregiverName) {
      HealthRepository.saveCaregiverAttributes({
        ...HealthRepository.getCaregiverAttributes(),
        name: effectiveInvite.caregiverName
      });
    }
  }

  // Migrate every other pre-claim clinical record. Each is independently
  // best-effort — a failure on one (e.g. no medications were ever recorded)
  // must not block the others or the claim itself.
  try {
    const dyadAttrsSnap = await getDoc(doc(db!, 'users', dyadDocId, 'caregiverAttributes', 'current'));
    const baseAttrs = dyadAttrsSnap.exists() ? dyadAttrsSnap.data() : DEFAULT_CAREGIVER_ATTRIBUTES;
    await withRetry(() =>
      setDoc(doc(db!, 'users', uid, 'caregiverAttributes', 'current'), {
        ...baseAttrs,
        name: effectiveInvite.caregiverName || (dyadAttrsSnap.exists() ? dyadAttrsSnap.data()?.name : null) || 'Primary Caregiver',
        updatedAt: claimedAt
      }, { merge: true })
    );
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

  return { ...effectiveInvite, claimedAt, claimedByUid: uid };
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

/**
 * Same idea as autoClaimInviteByPhone, matched on the auto-generated demo
 * login email a doctor derived at registration (see registerPatientDialog's
 * caregiverEmail field) instead of a phone number. Called on every sign-in
 * via provisionDemoPersonaAccess; a no-op for any account that isn't a
 * registered caregiver email.
 */
export async function autoClaimInviteByEmail(email: string | null): Promise<DyadInvite | null> {
  const uid = currentUid();
  if (!uid || !db || !email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const q = query(
      collection(db, 'dyadInvites'),
      where('caregiverEmail', '==', cleanEmail),
      where('claimedAt', '==', null)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const matched = snap.docs[0];
      return await applyInviteClaim(matched.ref, matched.data() as DyadInvite, uid);
    }

    // Fallback: If this invite was already claimed by this user account, ensure local caches are populated
    const qClaimed = query(
      collection(db, 'dyadInvites'),
      where('caregiverEmail', '==', cleanEmail),
      where('claimedByUid', '==', uid)
    );
    const snapClaimed = await getDocs(qClaimed);
    if (!snapClaimed.empty) {
      const inv = snapClaimed.docs[0].data() as DyadInvite;
      if (typeof window !== 'undefined') {
        const currentPt = HealthRepository.getPatientProfile();
        if ((!currentPt || currentPt.name === DEFAULT_PATIENT_PROFILE.name) && inv.patientName) {
          HealthRepository.savePatientProfile({
            ...DEFAULT_PATIENT_PROFILE,
            name: inv.patientName,
            age: inv.patientAge || DEFAULT_PATIENT_PROFILE.age,
            primaryConditions: inv.primaryConditions || DEFAULT_PATIENT_PROFILE.primaryConditions
          });
        }
        if (inv.caregiverName) {
          HealthRepository.saveCaregiverAttributes({
            ...HealthRepository.getCaregiverAttributes(),
            name: inv.caregiverName
          });
        }
      }
      return inv;
    }
    return null;
  } catch (err) {
    console.warn('Auto-claim by email skipped:', err);
    return null;
  }
}
