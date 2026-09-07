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

export async function DELETE(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const userAgent = request.headers.get('user-agent') || 'unknown-ua';

  try {
    const authUser = await authenticateRequest(request);
    if (!authUser || !authUser.isClinician) {
      return NextResponse.json({ error: 'Clinician authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientUid = searchParams.get('patientUid');
    const purgeDummies = searchParams.get('purgeDummies') === 'true';

    const db = adminDb();
    const batch = db.batch();
    let opsCount = 0;

    const uidsToDelete: string[] = [];
    if (patientUid) {
      uidsToDelete.push(patientUid);
      uidsToDelete.push(patientUid.replace('dyad_', ''));
      uidsToDelete.push(`dyad_${patientUid}`);
    }

    const isSarojini = patientUid && (patientUid.toLowerCase().includes('sarojini') || patientUid.toUpperCase().includes('SAROJINI81'));
    const isRamesh = patientUid && (patientUid.toLowerCase().includes('ramesh') || patientUid.toUpperCase().includes('RAMESH76'));

    if (purgeDummies || isSarojini) {
      uidsToDelete.push('dyad_sarojini_devi', 'demo-sarojini', 'sarojini_devi', 'SAROJINI81', 'dyad_SAROJINI81');
    }

    if (purgeDummies || isRamesh) {
      uidsToDelete.push('dyad_ramesh_chand', 'demo-ramesh', 'ramesh_chand', 'RAMESH76', 'dyad_RAMESH76');
    }

    if (purgeDummies) {
      uidsToDelete.push('demo-kamla');
    }

    const uniqueUids = Array.from(new Set(uidsToDelete));

    for (const id of uniqueUids) {
      batch.delete(db.collection('cohortSummaries').doc(id));
      opsCount++;

      const cleanCode = id.replace('dyad_', '');
      batch.delete(db.collection('dyadInvites').doc(cleanCode));
      opsCount++;

      batch.delete(db.collection('users').doc(id).collection('clinicianGrants').doc(authUser.uid));
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
      status: 'SUCCESS',
      details: { action: 'discharge_delete_patient', deletedUids: uniqueUids }
    });

    return NextResponse.json({ success: true, deleted: uniqueUids });
  } catch (err: unknown) {
    console.error('BFF Cohort DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete cohort record.' }, { status: 500 });
  }
}
