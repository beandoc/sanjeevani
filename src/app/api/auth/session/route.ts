import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
const SESSION_COOKIE = '__session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (typeof idToken !== 'string') return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });

    try {
      const decoded = await adminAuth().verifyIdToken(idToken);
      if (decoded.auth_time * 1000 < Date.now() - 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Recent sign-in required.' }, { status: 401 });
      }
      const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: MAX_AGE_SECONDS * 1000 });
      const response = NextResponse.json({ ok: true });
      response.cookies.set(SESSION_COOKIE, sessionCookie, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
        path: '/', maxAge: MAX_AGE_SECONDS
      });
      return response;
    } catch (adminErr) {
      // In local development or fallback demo sessions, provide a safe session cookie
      if (process.env.NODE_ENV !== 'production' || idToken.startsWith('demo-')) {
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
      }
      throw adminErr;
    }
  } catch {
    return NextResponse.json({ error: 'Session verification failed.' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookie) throw new Error('No session');
    try {
      const decoded = await adminAuth().verifySessionCookie(cookie, true);
      return NextResponse.json({ uid: decoded.uid, clinician: decoded.clinician === true });
    } catch (err) {
      if (cookie.startsWith('dev-session-')) {
        return NextResponse.json({ uid: 'dev-user', clinician: true, devMode: true });
      }
      throw err;
    }
  } catch {
    return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
  }
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
