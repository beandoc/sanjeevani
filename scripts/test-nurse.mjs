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

const auth = getAuth();
const db = getFirestore();

async function run() {
  const nurse = await auth.getUserByEmail('vishalnurse@kutumbh.com');
  console.log('Nurse Auth:', nurse.uid, nurse.email, nurse.customClaims);

  const nurseDoc = await db.collection('users').doc(nurse.uid).get();
  console.log('Nurse doc data:', nurseDoc.data());

  const abhishekDyad = 'c4WgNrxHbxZSlWSaCTQZAceTIt33';
  const grantSnap = await db.collection('users').doc(abhishekDyad).collection('clinicianGrants').get();
  console.log('clinicianGrants under Abhishek dyad:');
  grantSnap.forEach(d => console.log('  doc ID:', d.id, 'data:', d.data()));

  const ptSnap = await db.collection('users').doc(abhishekDyad).collection('patientProfile').doc('current').get();
  console.log('PatientProfile in Abhishek dyad:', ptSnap.exists ? ptSnap.data() : 'NOT FOUND');
}

run().catch(console.error);
