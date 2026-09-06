import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';

export const runtime = 'nodejs';
const SESSION_COOKIE = '__session';

const ProvisionClaimsSchema = z.object({
  targetUid: z.string().min(1, 'Valid targetUid required.'),
  role: z.enum(['doctor', 'nurse', 'caregiver', 'admin'], {
    errorMap: () => ({ message: 'Invalid role. Must be one of: doctor, nurse, caregiver, admin.' })
  })
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const userAgent = request.headers.get('user-agent') || 'unknown-ua';

  // Rate limit admin claims provisioning to prevent brute force
  const rateLimit = checkRateLimit(`admin-claims:${ip}`, { windowMs: 60 * 1000, maxRequests: 30 });
  if (!rateLimit.allowed) {
    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      ip,
      userAgent,
      status: 'BLOCKED',
      details: { endpoint: '/api/admin/claims' }
    });
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) {
      logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: 'ADMIN_CLAIMS_REJECTED',
        ip,
        userAgent,
        status: 'FAILURE',
        details: { reason: 'missing_session' }
      });
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const callerDecoded = await adminAuth().verifySessionCookie(cookie, true);

    // Only allow verified admins or configured bootstrap admin UID
    const isBootstrapAdmin =
      Boolean(process.env.BOOTSTRAP_ADMIN_UID) &&
      callerDecoded.uid === process.env.BOOTSTRAP_ADMIN_UID;

    if (!callerDecoded.admin && !isBootstrapAdmin) {
      logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: 'ADMIN_CLAIMS_REJECTED',
        actorUid: callerDecoded.uid,
        ip,
        userAgent,
        status: 'BLOCKED',
        details: { reason: 'forbidden_non_admin' }
      });
      return NextResponse.json({ error: 'Forbidden: Admin privilege required.' }, { status: 403 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = ProvisionClaimsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request payload.', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { targetUid, role } = parseResult.data;
    const normalizedRole = role.toLowerCase().trim();

    const isClinician = normalizedRole === 'doctor' || normalizedRole === 'nurse';
    const isAdmin = normalizedRole === 'admin';
    const assignedRole = normalizedRole === 'doctor' ? 'professional' : normalizedRole;

    const claims = {
      role: assignedRole,
      clinician: isClinician,
      admin: isAdmin
    };

    await adminAuth().setCustomUserClaims(targetUid, claims);

    // Mirror to Firestore user profile document
    try {
      const db = adminDb();
      await db.collection('users').doc(targetUid).set(
        {
          role: assignedRole,
          clinician: isClinician,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (dbErr) {
      console.warn('Could not mirror custom claim to Firestore users doc:', dbErr);
    }

    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'ADMIN_CLAIMS_PROVISIONED',
      actorUid: callerDecoded.uid,
      targetUid,
      ip,
      userAgent,
      status: 'SUCCESS',
      details: { claims }
    });

    return NextResponse.json({
      ok: true,
      targetUid,
      claims
    });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'ADMIN_CLAIMS_REJECTED',
      ip,
      userAgent,
      status: 'FAILURE',
      details: { error: errMessage }
    });
    return NextResponse.json({ error: errMessage || 'Claims provisioning failed.' }, { status: 500 });
  }
}
