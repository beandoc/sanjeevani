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

async function deepVerify() {
  console.log('=== 1. SEARCHING DYAD INVITES FOR VISHAL ===');
  const invitesSnap = await db.collection('dyadInvites').get();
  invitesSnap.forEach(d => {
    const data = d.data();
    if (JSON.stringify(data).toLowerCase().includes('vishal') || d.id === 'WLU47WFU') {
      console.log(`Invite [${d.id}]:`, JSON.stringify(data, null, 2));
    }
  });

  console.log('\n=== 2. INSPECTING ABHISHEK USER DOC & SUBCOLLECTIONS (c4WgNrxHbxZSlWSaCTQZAceTIt33) ===');
  const abhishekUid = 'c4WgNrxHbxZSlWSaCTQZAceTIt33';
  const userDoc = await db.collection('users').doc(abhishekUid).get();
  console.log('User root doc:', userDoc.data());

  const subcols = await db.collection('users').doc(abhishekUid).listCollections();
  console.log('Subcollections under Abhishek:');
  for (const col of subcols) {
    const docs = await col.get();
    console.log(`  Collection [${col.id}] (${docs.size} docs):`);
    docs.forEach(d => console.log(`    Doc [${d.id}]:`, JSON.stringify(d.data(), null, 2)));
  }

  console.log('\n=== 3. SEARCHING ANY OTHER USERS WITH "VISHAL" OR "ABHISHEK" ===');
  const allUsers = await db.collection('users').get();
  for (const u of allUsers.docs) {
    if (u.id === abhishekUid) continue;
    const data = u.data();
    if (JSON.stringify(data).toLowerCase().includes('vishal') || JSON.stringify(data).toLowerCase().includes('abhishek')) {
      console.log(`Found other user doc [${u.id}]:`, data);
    }
  }

  console.log('\n=== 4. CHECKING NURSE USER DOC & SUBCOLLECTIONS (2wOsckKFZqOgsZyoHudVr06TecJ2) ===');
  const nurseUid = '2wOsckKFZqOgsZyoHudVr06TecJ2';
  const nurseDoc = await db.collection('users').doc(nurseUid).get();
  console.log('Nurse root doc:', nurseDoc.data());
  const nurseSubcols = await db.collection('users').doc(nurseUid).listCollections();
  for (const col of nurseSubcols) {
    const docs = await col.get();
    console.log(`  Nurse subcollection [${col.id}] (${docs.size} docs):`);
    docs.forEach(d => console.log(`    Doc [${d.id}]:`, JSON.stringify(d.data(), null, 2)));
  }
}

deepVerify().catch(console.error);
