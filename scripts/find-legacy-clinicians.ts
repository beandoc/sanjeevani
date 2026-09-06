/**
 * One-time audit: lists every Firebase Auth user whose email matches the
 * now-removed email-pattern clinician inference (email starting with
 * "doctor" or "dr", or containing "doctor"/"clinic", was inferred as doctor
 * tier; starting with "nurse"/"vidya", or containing "nurse", was inferred
 * as nurse tier), and flags whether they already hold a matching custom
 * claim.
 *
 * Run this BEFORE relying on the app in production after the claims-based
 * auth hardening: any real clinician account without a claim will be
 * demoted to caregiver-only access the moment they next sign in.
 *
 * Usage:
 *   npx tsx scripts/find-legacy-clinicians.ts
 *
 * Needs the same FIREBASE_ADMIN_* credentials as scripts/set-claims.ts.
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

// Same patterns firestore.rules and the API routes used to trust before
// tonight's hardening — see the removed isDoctorEmail/isNurseEmail.
const isDoctorEmail = (email: string) =>
  /^(doctor|dr)/i.test(email) || /(doctor|clinic)/i.test(email);
const isNurseEmail = (email: string) =>
  /^(nurse|vidya)/i.test(email) || /nurse/i.test(email);

async function main() {
  const app = initAdmin();
  const auth = getAuth(app);

  console.log(`Scanning Auth users on project: ${projectId}\n`);

  const flagged: Array<{
    email: string;
    uid: string;
    inferredRole: 'doctor' | 'nurse';
    currentClaims: Record<string, unknown>;
    hasMatchingClaim: boolean;
  }> = [];

  let pageToken: string | undefined;
  let scanned = 0;

  do {
    const page = await auth.listUsers(1000, pageToken);
    pageToken = page.pageToken;
    for (const user of page.users) {
      scanned++;
      const email = user.email?.toLowerCase();
      if (!email) continue;

      const claims = user.customClaims || {};
      const doctor = isDoctorEmail(email);
      const nurse = !doctor && isNurseEmail(email);
      if (!doctor && !nurse) continue;

      const inferredRole: 'doctor' | 'nurse' = doctor ? 'doctor' : 'nurse';
      const hasMatchingClaim =
        claims.clinician === true &&
        (claims.role === (inferredRole === 'doctor' ? 'professional' : 'nurse') ||
          claims.role === inferredRole);

      flagged.push({ email, uid: user.uid, inferredRole, currentClaims: claims, hasMatchingClaim });
    }
  } while (pageToken);

  console.log(`Scanned ${scanned} total users.\n`);

  const needsAction = flagged.filter((f) => !f.hasMatchingClaim);
  const alreadyOk = flagged.filter((f) => f.hasMatchingClaim);

  if (needsAction.length > 0) {
    console.log(`⚠️  ${needsAction.length} account(s) previously relied on email-pattern inference and have NO matching claim — they will lose clinician access on next sign-in unless fixed:\n`);
    for (const f of needsAction) {
      console.log(`  ${f.email}  (uid: ${f.uid})  →  was inferred as: ${f.inferredRole}  |  current claims: ${JSON.stringify(f.currentClaims)}`);
      console.log(`    Fix: npx tsx scripts/set-claims.ts ${f.email} ${f.inferredRole}\n`);
    }
  } else {
    console.log('✅ No email-pattern-matched accounts are missing a claim.');
  }

  if (alreadyOk.length > 0) {
    console.log(`\n✅ ${alreadyOk.length} account(s) already have a matching claim — no action needed:`);
    for (const f of alreadyOk) {
      console.log(`  ${f.email}  (uid: ${f.uid})`);
    }
  }
}

main().catch((err) => {
  console.error('Scan failed:', err);
  process.exit(1);
});
