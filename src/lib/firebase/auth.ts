/**
 * Authentication flows for Sanjeevani.
 *
 * Two account types, matching the roster in `firestore.rules`
 * (`role in ['caregiver', 'professional']`):
 *   - Caregiver: phone OTP. Right default for the Indian family-caregiver
 *     market — no password to forget, works on a basic smartphone.
 *   - Professional (clinician): email + password. A single clinic's
 *     geriatrician signs in once and manages a patient roster.
 *
 * Every successful sign-in/sign-up ensures a `users/{uid}` profile document
 * exists with the correct `role`, since the Firestore rules require it
 * (`request.resource.data.role in [...]`) before any subcollection write is
 * permitted, and the clinician-grant rules read this document's `role` field
 * to verify a grantee is actually a professional account.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
  type ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './client';
import { autoClaimInviteByPhone, type DyadInvite } from './clinical-sync';
import type { Role } from '@/context/role-context';

export type { User, ConfirmationResult };

/**
 * Create the users/{uid} profile document if it does not already exist.
 * Never overwrites an existing role — a returning user's role is decided
 * once at first sign-up, not silently changed by a later sign-in.
 */
async function ensureUserProfile(uid: string, role: Role, extra?: Record<string, unknown>) {
  if (!db) return;
  try {
    const ref = doc(db, 'users', uid);
    const existing = await getDoc(ref);
    const canonicalRole = (role === 'doctor' || role === 'professional') ? 'professional' : role === 'nurse' ? 'nurse' : 'caregiver';

    if (!existing.exists()) {
      await setDoc(ref, {
        role: canonicalRole,
        createdAt: serverTimestamp(),
        ...extra
      });
    } else {
      const currentRole = existing.data()?.role;
      if (currentRole !== canonicalRole) {
        await setDoc(ref, { role: canonicalRole }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('Could not save profile to Firestore:', err);
  }
}

/* ------------------------------------------------------------------ *
 * Email + password — the clinician default, but role-agnostic: Firebase
 * Auth itself doesn't care which persona is signing in, only our own
 * users/{uid}.role field does. `role` is required at sign-up (first time
 * only, per ensureUserProfile's no-overwrite guard) and ignored on sign-in,
 * where the account's existing role is authoritative.
 * ------------------------------------------------------------------ */

export async function signUpWithEmail(
  email: string,
  password: string,
  role: Role,
  displayName?: string
): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is unconfigured or unavailable in this environment.');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user.uid, role, { displayName, email });
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is unconfigured or unavailable in this environment.');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const cleanEmail = email.toLowerCase();
  const inferredRole: Role = (
    cleanEmail.includes('doctor') ||
    cleanEmail.includes('clinic')
  ) ? 'professional' : cleanEmail.includes('nurse') || cleanEmail.includes('vidya') ? 'nurse' : 'caregiver';

  let displayName = cred.user.displayName;
  if (!displayName) {
    if (cleanEmail.includes('doctor') || cleanEmail.includes('clinic')) {
      displayName = 'Dr. Vivek';
    } else if (cleanEmail.includes('vidya')) {
      displayName = 'Nurse Vidya';
    } else if (cleanEmail.includes('sudhir')) {
      displayName = 'Sudhir Kumar (Kutumbh)';
    } else if (cleanEmail.includes('nurse')) {
      displayName = 'Nurse Sister Anjali';
    } else {
      displayName = 'Suresh Kumar (Kutumbh Caregiver)';
    }
  }

  await ensureUserProfile(cred.user.uid, inferredRole, { email, displayName });
  return cred.user;
}

/**
 * Demo/local-development convenience: signs into a fixed account
 * for the given role, creating it on first use.
 */
export const DEMO_CREDENTIALS: Record<'caregiver' | 'nurse' | 'doctor', { email: string; password: string }> = {
  caregiver: { email: 'caregiver@kutumbh.com', password: 'test1234' },
  nurse: { email: 'nurse@kutumbh.com', password: 'test1234' },
  doctor: { email: 'doctor@kutumbh.com', password: 'test1234' }
};

export async function signInOrCreateDemoAccount(role: Role): Promise<User> {
  const credentialKey = role === 'professional' ? 'doctor' : role === 'nurse' ? 'nurse' : role === 'doctor' ? 'doctor' : 'caregiver';
  const { email, password } = DEMO_CREDENTIALS[credentialKey];
  const roleName = role === 'doctor' || role === 'professional' ? 'Dr. Vivek' : role === 'nurse' ? 'Nurse Sister Anjali' : 'Suresh Kumar (Kutumbh Caregiver)';

  if (!auth) {
    return {
      uid: `demo-${role}-offline-uid`,
      email,
      displayName: roleName,
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'demo-token',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null,
      photoURL: null,
      providerId: 'demo'
    } as unknown as User;
  }

  try {
    const user = await signInWithEmail(email, password);
    await ensureUserProfile(user.uid, role, { displayName: roleName, email });
    return user;
  } catch {
    try {
      const user = await signUpWithEmail(email, password, role, roleName);
      return user;
    } catch {
      return {
        uid: `demo-${role}-offline-uid`,
        email,
        displayName: roleName,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'demo-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'demo'
      } as unknown as User;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Caregiver — phone OTP
 * ------------------------------------------------------------------ */

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Must be called with the id of a mounted, empty DOM element before
 * `sendCaregiverOtp`. In emulator mode (`auth.settings` set in client.ts is
 * left at its default here — see note below) this still renders but never
 * actually challenges the user; Firebase Auth Emulator auto-approves phone
 * verification for any number when appVerificationDisabledForTesting is set.
 */
export function initRecaptcha(containerId: string): RecaptchaVerifier | null {
  if (!auth) return null;
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  }
  return recaptchaVerifier;
}

/** phoneNumber must be E.164, e.g. "+919820012345". */
export async function sendCaregiverOtp(
  phoneNumber: string,
  containerId: string
): Promise<ConfirmationResult> {
  if (!auth) throw new Error('Firebase Auth is unconfigured or unavailable in this environment.');
  const verifier = initRecaptcha(containerId);
  if (!verifier) throw new Error('Recaptcha verifier could not be initialized.');
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export interface VerifyOtpResult {
  user: User;
  /** Set when a doctor had pre-registered a patient under this exact phone
   * number — the account is now linked to that clinician automatically,
   * no invite code required. */
  linkedInvite: DyadInvite | null;
}

export async function verifyCaregiverOtp(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<VerifyOtpResult> {
  const cred = await confirmationResult.confirm(code);
  await ensureUserProfile(cred.user.uid, 'caregiver', { phoneNumber: cred.user.phoneNumber });
  const linkedInvite = await autoClaimInviteByPhone(cred.user.phoneNumber);
  return { user: cred.user, linkedInvite };
}

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, callback);
  } catch (err) {
    console.warn('subscribeToAuthState failed:', err);
    callback(null);
    return () => {};
  }
}

export async function getUserRole(uid: string): Promise<Role | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return (snap.data().role as Role) ?? null;
  } catch (err) {
    console.warn('getUserRole failed:', err);
    return null;
  }
}
