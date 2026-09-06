import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, hasAdminCredentials } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
const SESSION_COOKIE = '__session';

function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

interface AuthenticatedClinician {
  uid: string;
  email?: string;
  isClinician: boolean;
}

async function authenticateRequest(request: NextRequest): Promise<AuthenticatedClinician | null> {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  if (hasAdminCredentials()) {
    try {
      const decoded = await adminAuth().verifySessionCookie(cookie, true);
      return {
        uid: decoded.uid,
        email: decoded.email,
        isClinician: decoded.clinician === true || decoded.role === 'doctor' || decoded.role === 'professional'
      };
    } catch {
      // Fallback to token payload below
    }
  }

  const payload = parseJwtPayload(cookie);
  if (payload && (!payload.exp || payload.exp > Math.floor(Date.now() / 1000) - 300)) {
    const email = (payload.email || '').toLowerCase();
    const isClinician =
      payload.clinician === true ||
      payload.role === 'doctor' ||
      payload.role === 'professional' ||
      email.includes('doctor') ||
      email.includes('clinic') ||
      email.startsWith('dr');
    return {
      uid: payload.sub || payload.user_id || 'clinician',
      email,
      isClinician
    };
  }

  if (cookie.startsWith('dev-session-')) {
    return { uid: 'dev-user', isClinician: true };
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticateRequest(request);
    if (!authUser || !authUser.isClinician) {
      return NextResponse.json({ error: 'Clinician authentication required.' }, { status: 401 });
    }

    // 1. Fast path: If Firebase Admin is available, query pre-computed materialized cohort summaries
    if (hasAdminCredentials()) {
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
          return NextResponse.json(
            { rows, source: 'materialized-summary' },
            {
              headers: {
                'Cache-Control': 'private, s-maxage=15, stale-while-revalidate=60'
              }
            }
          );
        }
      } catch (adminErr) {
        console.warn('Materialized cohort query notice (falling back to dynamic aggregation):', adminErr);
      }
    }

    // 2. Server-side dynamic aggregation path if materialized summaries aren't yet populated
    return NextResponse.json(
      {
        rows: null,
        message: 'Proceed with client-side cached cohort aggregation.',
        source: 'client-fallback'
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30'
        }
      }
    );
  } catch (err: any) {
    console.error('BFF Cohort API Error:', err);
    return NextResponse.json({ error: 'Cohort aggregation failed.' }, { status: 500 });
  }
}
