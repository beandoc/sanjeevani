/**
 * Firebase client SDK initialization.
 *
 * Local development connects to the Firebase Local Emulator Suite by default
 * (NEXT_PUBLIC_USE_FIREBASE_EMULATOR="true" in .env), so the app has a real,
 * working Auth + Firestore backend without needing a live Google Cloud
 * project or credentials. Swap in a real project's config in .env.local and
 * set that flag to "false" for a production deployment — no code change
 * needed here.
 *
 * This module is client-safe (no server secrets) and guards against
 * double-initialization across Next.js Fast Refresh / multiple imports.
 *
 * Offline persistence:
 * When running against a real project (not the emulator), Firestore is
 * initialized with IndexedDB-backed persistence so writes made while offline
 * are durably queued and automatically replayed on reconnect. This is the
 * authoritative durability layer for signed-in users — localStorage
 * (HealthRepository) acts as a warm read-cache and SSR fallback, not the
 * source of truth.
 *
 * Persistence is intentionally disabled in emulator mode because the Firebase
 * SDK throws if you attempt to combine connectFirestoreEmulator with
 * persistentLocalCache — see:
 * https://github.com/firebase/firebase-js-sdk/issues/6083
 *
 * Persistence is also disabled during SSR (typeof window === 'undefined')
 * since IndexedDB is not available in Node.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// Module-scope guards so hot-reload in dev doesn't try to reconnect to the
// emulator on every re-render (connectXEmulator throws if called twice).
let emulatorsConnected = false;

function getFirebaseApp(): FirebaseApp | null {
  try {
    if (getApps().length) return getApp();
    // Validate that apiKey exists before attempting initialization
    if (!firebaseConfig.apiKey) {
      console.warn('Firebase API key is missing. Falling back to offline mode.');
      return null;
    }
    return initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('Firebase App initialization warning:', err);
    return null;
  }
}

function getFirebaseAuth(): Auth | null {
  try {
    const app = getFirebaseApp();
    if (!app) return null;
    const authInstance = getAuth(app);
    if (USE_EMULATOR && typeof window !== 'undefined' && !emulatorsConnected) {
      try {
        connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
        authInstance.settings.appVerificationDisabledForTesting = true;
      } catch (emuErr) {
        console.warn('Firebase Auth Emulator connection skipped:', emuErr);
      }
    }
    return authInstance;
  } catch (err) {
    console.warn('Firebase Auth initialization skipped (invalid API key or unconfigured project):', err);
    return null;
  }
}

function getFirebaseFirestore(): Firestore | null {
  try {
    const app = getFirebaseApp();
    if (!app) return null;

    // Emulator mode: use plain getFirestore. The emulator SDK cannot be
    // combined with persistentLocalCache and will throw if attempted.
    if (USE_EMULATOR) {
      const dbInstance = getFirestore(app);
      if (typeof window !== 'undefined' && !emulatorsConnected) {
        try {
          connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
        } catch (emuErr) {
          console.warn('Firestore Emulator connection skipped:', emuErr);
        }
      }
      return dbInstance;
    }

    // Production / staging: use initializeFirestore with IndexedDB persistence.
    // persistentMultipleTabManager allows the same cache to be used across
    // browser tabs, which is important for caregivers who may have the app
    // open in multiple tabs simultaneously.
    //
    // initializeFirestore is idempotent if the app is already initialized —
    // calling it twice with the same settings is safe.
    if (typeof window !== 'undefined') {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    }

    // SSR fallback: no IndexedDB available in Node, use plain Firestore.
    return getFirestore(app);
  } catch (err) {
    console.warn('Firebase Firestore initialization skipped (falling back to offline mode):', err);
    return null;
  }
}

export const firebaseApp = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
emulatorsConnected = true;
