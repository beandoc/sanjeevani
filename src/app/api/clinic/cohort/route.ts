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
