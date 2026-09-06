/**
 * Shared result shape for the caregiver-side sync helpers in this module.
 */

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
