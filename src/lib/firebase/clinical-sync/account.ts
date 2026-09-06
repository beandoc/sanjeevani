/**
 * Account-scoped records that belong to the signed-in user rather than to a
 * clinical series: emergency contacts, DPDP consent, autosaved form drafts,
 * UI preferences, and the full local-cache hydration run on sign-in.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../client';
import { type ZaritEvaluationResult } from '@/lib/zarit-scale';
import {
  HealthRepository,
  type EmergencyContact,
  type UserConsentPreferences,
  type AppointmentRecord
} from '@/lib/db/health-repository';
import { currentUid, mergeZaritAssessments } from './internal';
import type { SyncResult } from './types';
import { getPatientProfileFor, getCaregiverAttributesFor } from './profile';
import { getMedicationsFor } from './medications';
import { getVitalsFor } from './vitals';
import { getAppointmentsFor } from './appointments';
import { getModuleProgressFor } from './learning-modules';
import { getCareCircleFor } from './care-circle';
import { getBedsideRoutineChecklistFor, getDischargeMilestonesFor } from './daily-care';
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
