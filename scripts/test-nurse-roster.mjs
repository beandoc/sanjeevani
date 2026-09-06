import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();

async function testRoster() {
  const nurseUid = '2wOsckKFZqOgsZyoHudVr06TecJ2';
  const snap = await db.collectionGroup('clinicianGrants')
    .where('clinicianUid', '==', nurseUid)
    .where('revokedAt', '==', null)
    .get();

  console.log('Collection group results for nurse:', snap.docs.length);
  snap.docs.forEach(doc => {
    const pUid = doc.ref.parent.parent.id;
    console.log('  Parent Dyad UID:', pUid, 'Grant data:', doc.data());
  });
}

testRoster().catch(console.error);
