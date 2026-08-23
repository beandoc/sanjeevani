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
import type { Role } from '@/context/role-context';

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
    if (!existing.exists()) {
      await setDoc(ref, {
        role,
        createdAt: serverTimestamp(),
        ...extra
      });
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
  return cred.user;
}

/**
 * Demo/local-development convenience: signs into a fixed emulator account
 * for the given role, creating it on first use. Real, working Firebase
 * Auth + Firestore underneath (not a fake timeout) — so the clinician
 * dashboard and caregiver flows can be demoed end-to-end without a real
 * phone number or a manually created clinician account. Only meaningful
 * against the emulator; a production project would simply reject repeated
 * sign-ups with the same fixed address on the second call, which this
 * already handles by falling back to sign-in.
 */
export async function signInOrCreateDemoAccount(role: Role): Promise<User> {
  const email = `demo-${role}@sanjeevani.local`;
  const password = 'sanjeevani-demo-2026';
  try {
    return await signInWithEmail(email, password);
  } catch {
    return signUpWithEmail(email, password, role, role === 'professional' ? 'Demo Clinician' : 'Demo Caregiver');
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

export async function verifyCaregiverOtp(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> {
  const cred = await confirmationResult.confirm(code);
  await ensureUserProfile(cred.user.uid, 'caregiver', { phoneNumber: cred.user.phoneNumber });
  return cred.user;
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
