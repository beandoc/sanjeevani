import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, DELETE } from '@/app/api/auth/session/route';
import { GET as cohortGet } from '@/app/api/clinic/cohort/route';

describe('Auth Hardening & Bypass Elimination (Phase 1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/session', () => {
    it('rejects empty or missing ID tokens with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: '' })
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('rejects unverified forged tokens with 401 instead of falling back to insecure parsing', async () => {
      // Craft a forged base64 JWT payload with clinician: true
      const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const fakePayload = Buffer.from(
        JSON.stringify({
          sub: 'attacker-uid',
          email: 'doctor@forged.com',
          clinician: true,
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      ).toString('base64url');
      const forgedToken = `${fakeHeader}.${fakePayload}.forged_signature`;

      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: forgedToken })
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/auth/session', () => {
    it('rejects requests without session cookies with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET'
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('rejects dev-session-* cookie bypass with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
        headers: {
          cookie: '__session=dev-session-12345-fake-token'
        }
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/clinic/cohort', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/clinic/cohort', {
        method: 'GET'
      });
      const res = await cohortGet(req);
      expect(res.status).toBe(401);
    });

    it('rejects dev-session-* cookie bypass on cohort endpoint with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/clinic/cohort', {
        method: 'GET',
        headers: {
          cookie: '__session=dev-session-99999-forged'
        }
      });
      const res = await cohortGet(req);
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/session', () => {
    it('clears session cookie', () => {
      const res = DELETE();
      expect(res.status).toBe(200);
      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('__session=;');
    });
  });
});
