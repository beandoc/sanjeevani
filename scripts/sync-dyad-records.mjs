import { initializeApp, cert, getApps } from 'firebase-admin/app';
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

async function migrateDyadData() {
  const sourceDyad = 'dyad_WLU47WFU';
  const targetDyad = 'c4WgNrxHbxZSlWSaCTQZAceTIt33';

  console.log(`Migrating all doctor-entered clinical data from ${sourceDyad} to ${targetDyad}...`);

  // 1. Medications
  const medsSnap = await db.collection('users').doc(sourceDyad).collection('medications').doc('current').get();
  if (medsSnap.exists) {
    await db.collection('users').doc(targetDyad).collection('medications').doc('current').set(medsSnap.data());
    console.log('  Migrated medications/current:', medsSnap.data());
  }

  // 2. Vitals
  const vitalsSnap = await db.collection('users').doc(sourceDyad).collection('vitals').get();
  for (const doc of vitalsSnap.docs) {
    await db.collection('users').doc(targetDyad).collection('vitals').doc(doc.id).set(doc.data());
    console.log(`  Migrated vitals/${doc.id}:`, doc.data().bp, doc.data().pulse);
  }

  // 3. Function Scores
  const funcSnap = await db.collection('users').doc(sourceDyad).collection('functionScores').get();
  for (const doc of funcSnap.docs) {
    await db.collection('users').doc(targetDyad).collection('functionScores').doc(doc.id).set(doc.data());
    console.log(`  Migrated functionScores/${doc.id}`);
  }

  // 4. Zarit Assessments
  const zaritSnap = await db.collection('users').doc(sourceDyad).collection('zaritAssessments').get();
  for (const doc of zaritSnap.docs) {
    await db.collection('users').doc(targetDyad).collection('zaritAssessments').doc(doc.id).set(doc.data());
    console.log(`  Migrated zaritAssessments/${doc.id}: score ${doc.data().totalScore}`);
  }

  console.log('Migration complete!');
}

migrateDyadData().catch(console.error);
