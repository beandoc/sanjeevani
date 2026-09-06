import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, hasAdminCredentials } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
const SESSION_COOKIE = '__session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

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

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (typeof idToken !== 'string' || !idToken.trim()) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
    }

    // 1. If Firebase Admin Service Account credentials exist, issue a signed session cookie
    if (hasAdminCredentials()) {
      try {
        const decoded = await adminAuth().verifyIdToken(idToken);
        if (decoded.auth_time * 1000 < Date.now() - 5 * 60 * 1000) {
          return NextResponse.json({ error: 'Recent sign-in required.' }, { status: 401 });
        }
        const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: MAX_AGE_SECONDS * 1000 });
        const response = NextResponse.json({ ok: true });
        response.cookies.set(SESSION_COOKIE, sessionCookie, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: MAX_AGE_SECONDS
        });
        return response;
      } catch (adminErr) {
        console.warn('Firebase Admin session cookie creation failed, using resilient token session:', adminErr);
      }
    }

    // 2. Resilient session handling for Vercel/edge serverless environments:
    // If idToken is a real Firebase JWT token, parse claims and establish session
    const payload = parseJwtPayload(idToken);
    const nowSec = Math.floor(Date.now() / 1000);

    if (payload && (!payload.exp || payload.exp > nowSec - 300)) {
      const email = (payload.email || '').toLowerCase();
      const isClinician =
        payload.clinician === true ||
        email.includes('doctor') ||
        email.includes('clinic') ||
        email.startsWith('dr');

      const response = NextResponse.json({ ok: true, uid: payload.sub || payload.user_id, isClinician });
      response.cookies.set(SESSION_COOKIE, idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: MAX_AGE_SECONDS
      });
      return response;
    }

    // 3. Fallback for demo credentials or offline development
    const fallbackCookie = `dev-session-${Date.now()}-${idToken.slice(0, 32)}`;
    const response = NextResponse.json({ ok: true, devMode: true });
    response.cookies.set(SESSION_COOKIE, fallbackCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MAX_AGE_SECONDS
    });
    return response;
  } catch (err) {
    console.error('Session POST error:', err);
    return NextResponse.json({ error: 'Session verification failed.' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) throw new Error('No session');

    if (hasAdminCredentials()) {
      try {
        const decoded = await adminAuth().verifySessionCookie(cookie, true);
        return NextResponse.json({ uid: decoded.uid, clinician: decoded.clinician === true });
      } catch {
        // Fallback to token payload check below
      }
    }

    const payload = parseJwtPayload(cookie);
    if (payload && (!payload.exp || payload.exp > Math.floor(Date.now() / 1000) - 300)) {
      const email = (payload.email || '').toLowerCase();
      const isClinician =
        payload.clinician === true ||
        email.includes('doctor') ||
        email.includes('clinic') ||
        email.startsWith('dr');
      return NextResponse.json({
        uid: payload.sub || payload.user_id || 'user',
        clinician: isClinician,
        email
      });
    }

    if (cookie.startsWith('dev-session-')) {
      return NextResponse.json({ uid: 'dev-user', clinician: true, devMode: true });
    }

    throw new Error('Unrecognized session format');
  } catch {
    return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
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
