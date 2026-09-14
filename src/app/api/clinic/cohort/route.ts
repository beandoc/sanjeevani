import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { logAuditEvent } from '@/lib/security/audit';

export const runtime = 'nodejs';
const SESSION_COOKIE = '__session';

interface AuthenticatedClinician {
  uid: string;
  email?: string;
  isClinician: boolean;
}

async function authenticateRequest(request: NextRequest): Promise<AuthenticatedClinician | null> {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const isClinician =
      decoded.clinician === true ||
      decoded.role === 'doctor' ||
      decoded.role === 'nurse' ||
      decoded.role === 'professional';

    return {
      uid: decoded.uid,
      email: decoded.email,
      isClinician
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const userAgent = request.headers.get('user-agent') || 'unknown-ua';

  try {
    const authUser = await authenticateRequest(request);
    if (!authUser || !authUser.isClinician) {
      logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: 'CLINICAL_COHORT_READ',
        actorUid: authUser?.uid || null,
        ip,
        userAgent,
        status: 'BLOCKED',
        details: { reason: 'unauthorized_clinician_access' }
      });
      return NextResponse.json({ error: 'Clinician authentication required.' }, { status: 401 });
    }

    // 1. Fast path: Query pre-computed materialized cohort summaries if populated
    try {
      const db = adminDb();
      const summariesSnap = await db
        .collection('cohortSummaries')
        .where('clinicianUid', '==', authUser.uid)
        .orderBy('riskBandOrder', 'asc')
        .limit(50)
        .get();

      if (!summariesSnap.empty) {
        const rows = summariesSnap.docs.map((doc) => doc.data());
        logAuditEvent({
          timestamp: new Date().toISOString(),
          eventType: 'CLINICAL_COHORT_READ',
          actorUid: authUser.uid,
          actorRole: 'clinician',
          ip,
          userAgent,
          status: 'SUCCESS',
          details: { source: 'materialized-summary', count: rows.length }
        });

        return NextResponse.json(
          { rows, source: 'materialized-summary' },
          {
            headers: {
              'Cache-Control': 'private, max-age=15, stale-while-revalidate=60'
            }
          }
        );
      }
    } catch (adminErr) {
      console.warn('Materialized cohort query notice (falling back to dynamic aggregation):', adminErr);
    }

    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'CLINICAL_COHORT_READ',
      actorUid: authUser.uid,
      actorRole: 'clinician',
      ip,
      userAgent,
      status: 'SUCCESS',
      details: { source: 'client-fallback' }
    });

    // 2. Server-side dynamic aggregation path if materialized summaries aren't yet populated
    return NextResponse.json(
      {
        rows: null,
        message: 'Proceed with client-side cached cohort aggregation.',
        source: 'client-fallback'
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
        }
      }
    );
  } catch (err: unknown) {
    console.error('BFF Cohort API Error:', err);
    return NextResponse.json({ error: 'Cohort aggregation failed.' }, { status: 500 });
  }
}

/**
 * Hardcoded seed/demo dyad uids. Recursive deletion under `purgeDummies` is intentionally
 * restricted to exactly this list — never to whatever a client passes in — so "purge demo data"
 * can never be used to mass-delete real patients.
 */
const KNOWN_DUMMY_UIDS = [
  'dyad_sarojini_devi', 'demo-sarojini', 'sarojini_devi', 'SAROJINI81', 'dyad_SAROJINI81',
  'dyad_ramesh_chand', 'demo-ramesh', 'ramesh_chand', 'RAMESH76', 'dyad_RAMESH76',
  'demo-kamla', 'kamla_gupta', 'dyad_kamla_gupta'
];

/**
 * True once this clinician has (or ever had, via a grant doc) documented access to this uid.
 * Required before a single-patient discharge is allowed to permanently delete that dyad's
 * records — without this, any authenticated clinician could pass an arbitrary `patientUid` and
 * destroy a colleague's patient data they were never granted access to.
 */
async function clinicianHasGrantFor(db: FirebaseFirestore.Firestore, uid: string, clinicianUid: string): Promise<boolean> {
  const snap = await db.collection('users').doc(uid).collection('clinicianGrants').doc(clinicianUid).get();
  return snap.exists;
}

export async function DELETE(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const userAgent = request.headers.get('user-agent') || 'unknown-ua';

  try {
    const authUser = await authenticateRequest(request);
    if (!authUser || !authUser.isClinician) {
      return NextResponse.json({ error: 'Clinician authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientUid = searchParams.get('patientUid')?.trim() || null;
    const purgeDummies = searchParams.get('purgeDummies') === 'true';

    const db = adminDb();

    const uidsToDelete = new Set<string>();

    if (patientUid) {
      const candidates = [patientUid, patientUid.replace('dyad_', ''), `dyad_${patientUid}`];
      const isKnownDummy = candidates.some((c) => KNOWN_DUMMY_UIDS.includes(c));

      // A real (non-demo) patient can only be discharged/deleted by a clinician who currently
      // holds, or has ever held, a grant for that specific dyad — never by uid alone.
      if (!isKnownDummy) {
        const grantChecks = await Promise.all(candidates.map((c) => clinicianHasGrantFor(db, c, authUser.uid)));
        if (!grantChecks.some(Boolean)) {
          logAuditEvent({
            timestamp: new Date().toISOString(),
            eventType: 'CLINICAL_COHORT_WRITE',
            actorUid: authUser.uid,
            actorRole: 'clinician',
            ip,
            userAgent,
            status: 'BLOCKED',
            details: { reason: 'no_grant_for_discharge_target', patientUid }
          });
          return NextResponse.json({ error: 'No documented access to this patient dyad.' }, { status: 403 });
        }
      }

      candidates.forEach((c) => uidsToDelete.add(c));

      const isSarojini = patientUid.toLowerCase().includes('sarojini') || patientUid.toUpperCase().includes('SAROJINI81');
      const isRamesh = patientUid.toLowerCase().includes('ramesh') || patientUid.toUpperCase().includes('RAMESH76');
      if (isSarojini) ['dyad_sarojini_devi', 'demo-sarojini', 'sarojini_devi', 'SAROJINI81', 'dyad_SAROJINI81'].forEach((u) => uidsToDelete.add(u));
      if (isRamesh) ['dyad_ramesh_chand', 'demo-ramesh', 'ramesh_chand', 'RAMESH76', 'dyad_RAMESH76'].forEach((u) => uidsToDelete.add(u));
    }

    if (purgeDummies) {
      KNOWN_DUMMY_UIDS.forEach((u) => uidsToDelete.add(u));
    }

    const uniqueUids = Array.from(uidsToDelete);

    // Recursively delete the user's ENTIRE document tree — patientProfile, caregiverAttributes,
    // zaritAssessments, vitals, medications, appointments, dailyCareLogs, careCircle,
    // clinicianGrants, moduleProgress, clinicalAuthorization, exportAuditLog, everything — plus
    // the users/{uid} doc itself. The previous version only deleted the cohortSummaries cache
    // and dyadInvites/clinicianGrants pointers, which unlinked a dyad from a clinician's roster
    // without ever deleting the underlying clinical data; "Purge Dummy Patients" reported success
    // while the seeded demo PHI-shaped records remained in Firestore indefinitely.
    const deletionResults = await Promise.allSettled(
      uniqueUids.map((id) => db.recursiveDelete(db.collection('users').doc(id)))
    );
    const failedDeletes = uniqueUids.filter((_, i) => deletionResults[i].status === 'rejected');

    const batch = db.batch();
    let opsCount = 0;
    for (const id of uniqueUids) {
      batch.delete(db.collection('cohortSummaries').doc(id));
      opsCount++;
      batch.delete(db.collection('dyadInvites').doc(id.replace('dyad_', '')));
      opsCount++;
    }
    if (opsCount > 0) {
      await batch.commit();
    }

    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'CLINICAL_COHORT_WRITE',
      actorUid: authUser.uid,
      actorRole: 'clinician',
      ip,
      userAgent,
      status: failedDeletes.length > 0 ? 'FAILURE' : 'SUCCESS',
      details: { action: 'discharge_delete_patient_recursive', deletedUids: uniqueUids, failedUids: failedDeletes }
    });

    if (failedDeletes.length > 0) {
      return NextResponse.json(
        { success: false, deleted: uniqueUids.filter((u) => !failedDeletes.includes(u)), failed: failedDeletes },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: uniqueUids });
  } catch (err: unknown) {
    console.error('BFF Cohort DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete cohort record.' }, { status: 500 });
  }
}
