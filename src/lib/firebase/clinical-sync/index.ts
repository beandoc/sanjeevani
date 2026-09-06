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
 *
 * ---------------------------------------------------------------------
 * This module was one 2,650-line file. It is now split by clinical domain,
 * with this barrel preserving the original import path (`@/lib/firebase/
 * clinical-sync`) so no call site had to change. Import from a submodule
 * directly if you only need one domain; `./internal` is deliberately not
 * re-exported here — it holds private helpers, not public API.
 */

export type { SyncResult } from './types';

export * from './assessments';
export * from './profile';
export * from './vitals';
export * from './daily-care';
export * from './medications';
export * from './learning-modules';
export * from './care-circle';
export * from './appointments';
export * from './account';
export * from './alerts';
export * from './dyad-invites';
export * from './access';
export * from './dyad-subscriptions';
export * from './cohort-summary';
export * from './seed';
