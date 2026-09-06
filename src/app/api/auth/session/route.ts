import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth } from '@/lib/firebase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logAuditEvent } from '@/lib/security/audit';

export const runtime = 'nodejs';
const SESSION_COOKIE = '__session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 5; // 5 days

const SessionPayloadSchema = z.object({
  idToken: z.string().min(10, 'Valid Firebase ID token required.')
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
  const userAgent = request.headers.get('user-agent') || 'unknown-ua';

  // Enforce IP-based rate limiting on session creation
  const rateLimit = checkRateLimit(`session:${ip}`, { windowMs: 60 * 1000, maxRequests: 20 });
  if (!rateLimit.allowed) {
    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      ip,
      userAgent,
      status: 'BLOCKED',
      details: { endpoint: '/api/auth/session' }
    });
    return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = SessionPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request payload.', details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const { idToken } = parseResult.data;

    // Cryptographically verify ID token with Firebase Admin
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    // Enforce recent sign-in within last 5 minutes to prevent replay attacks
    if (decoded.auth_time * 1000 < Date.now() - 5 * 60 * 1000) {
      logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: 'AUTH_SESSION_REJECTED',
        actorUid: decoded.uid,
        ip,
        userAgent,
        status: 'FAILURE',
        details: { reason: 'stale_token_auth_time' }
      });
      return NextResponse.json({ error: 'Recent sign-in required.' }, { status: 401 });
    }

    // Mint an authentic Firebase Admin session cookie
    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: MAX_AGE_SECONDS * 1000
    });

    const isClinician =
      decoded.clinician === true ||
      decoded.role === 'doctor' ||
      decoded.role === 'nurse' ||
      decoded.role === 'professional';

    // A bare `clinician: true` claim carries no tier, so it resolves to the
    // least-privileged clinical role rather than 'doctor' (which is the
    // clinic-wide tier). /api/admin/claims maps a provisioned doctor to
    // 'professional', so a real doctor always arrives with an explicit role.
    const role = decoded.role || (isClinician ? 'professional' : 'caregiver');

    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'AUTH_SESSION_CREATED',
      actorUid: decoded.uid,
      actorRole: role,
      ip,
      userAgent,
      status: 'SUCCESS'
    });

    const response = NextResponse.json({
      ok: true,
      uid: decoded.uid,
      isClinician,
      role
    });

    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS
    });

    return response;
  } catch (err) {
    logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'AUTH_SESSION_REJECTED',
      ip,
      userAgent,
      status: 'FAILURE',
      details: { error: err instanceof Error ? err.message : String(err) }
    });
    return NextResponse.json({ error: 'Authentication failed. Invalid or revoked token.' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'No active session.' }, { status: 401 });
    }

    // Cryptographically verify session cookie and check revocation status
    const decoded = await adminAuth().verifySessionCookie(cookie, true);

    const isClinician =
      decoded.clinician === true ||
      decoded.role === 'doctor' ||
      decoded.role === 'nurse' ||
      decoded.role === 'professional';

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email || null,
      clinician: isClinician,
      role: decoded.role || (isClinician ? 'professional' : 'caregiver')
    });
  } catch {
    return NextResponse.json({ error: 'Unauthenticated or expired session.' }, { status: 401 });
  }
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return response;
}
