import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function adminApp() {
  if (getApps().length) return getApps()[0];

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  // If running against Firebase emulator, initialize without requiring private key
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp(projectId ? { projectId } : undefined);
  }

  // Application Default Credentials (ADC) on Google Cloud / Firebase App Hosting
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE || process.env.FIREBASE_CONFIG) {
    return initializeApp(projectId ? { projectId } : undefined);
  }

  throw new Error(
    'Firebase Admin configuration error: Missing service account credentials, Application Default Credentials, or FIREBASE_AUTH_EMULATOR_HOST. Refusing to start unverified auth.'
  );
}

/** True when a full service account, ADC, or emulator is configured. */
export function hasAdminCredentials(): boolean {
  if (Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)) return true;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (Boolean(projectId && clientEmail && privateKey)) return true;
  if (Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE)) return true;
  return false;
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

