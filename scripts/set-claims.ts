/**
 * CLI tool to provision Firebase Custom User Claims for Sanjeevani roles.
 *
 * Usage:
 *   npx tsx scripts/set-claims.ts <email-or-uid> <doctor|nurse|caregiver|admin>
 *
 * Example:
 *   npx tsx scripts/set-claims.ts doctor@kutumbh.com doctor
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

function initAdmin() {
  if (getApps().length) return getApps()[0];

  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp(projectId ? { projectId } : undefined);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    return initializeApp(projectId ? { projectId } : undefined);
  }

  throw new Error('Firebase Admin unconfigured: Missing service account, ADC, or FIREBASE_AUTH_EMULATOR_HOST.');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/set-claims.ts <email-or-uid> <doctor|nurse|caregiver|admin>');
    process.exit(1);
  }

  const [identifier, roleInput] = args;
  const role = roleInput.toLowerCase().trim();

  if (!['doctor', 'nurse', 'caregiver', 'admin'].includes(role)) {
    console.error(`Invalid role: "${role}". Must be one of: doctor, nurse, caregiver, admin.`);
    process.exit(1);
  }

  const app = initAdmin();
  const auth = getAuth(app);
  const db = getFirestore(app);

  let userRecord;
  try {
    if (identifier.includes('@')) {
      userRecord = await auth.getUserByEmail(identifier.trim().toLowerCase());
    } else {
      userRecord = await auth.getUser(identifier.trim());
    }
  } catch (err: unknown) {
    console.error(`Could not find user "${identifier}":`, err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const isClinician = role === 'doctor' || role === 'nurse';
  const isAdmin = role === 'admin';
  const assignedRole = role === 'doctor' ? 'professional' : role;

  const claims = {
    role: assignedRole,
    clinician: isClinician,
    admin: isAdmin
  };

  await auth.setCustomUserClaims(userRecord.uid, claims);
  console.log(`✅ Successfully set custom claims on ${userRecord.email} (${userRecord.uid}):`, claims);

  // Sync to Firestore profile
  try {
    await db.collection('users').doc(userRecord.uid).set(
      {
        role: assignedRole,
        clinician: isClinician,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    console.log(`✅ Synced role to Firestore users/${userRecord.uid}`);
  } catch (dbErr: unknown) {
    console.warn(`⚠️ Could not update Firestore doc:`, dbErr instanceof Error ? dbErr.message : dbErr);
  }

  console.log('\nNOTE: The user must call user.getIdToken(true) or sign in again to refresh their token claims.');
}

main().catch((err) => {
  console.error('Failed to set claims:', err);
  process.exit(1);
});
