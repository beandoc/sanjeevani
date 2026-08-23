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
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

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

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  if (USE_EMULATOR && typeof window !== 'undefined' && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    // Emulator-only: skips the real reCAPTCHA challenge for phone-OTP sign-in
    // so local development doesn't need a live site key. Never set outside
    // the emulator — production phone auth must go through real verification.
    auth.settings.appVerificationDisabledForTesting = true;
  }
  return auth;
}

function getFirebaseFirestore(): Firestore {
  const db = getFirestore(getFirebaseApp());
  if (USE_EMULATOR && typeof window !== 'undefined' && !emulatorsConnected) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  return db;
}

export const firebaseApp = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
emulatorsConnected = true;
