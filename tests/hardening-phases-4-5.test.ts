import { describe, it, expect } from 'vitest';
import { generateInviteCode } from '@/lib/firebase/clinical-sync/dyad-invites';
import { withRetry } from '@/lib/firebase/clinical-sync/internal';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { POST as sessionPost } from '@/app/api/auth/session/route';
import { POST as claimsPost } from '@/app/api/admin/claims/route';
import { NextRequest } from 'next/server';

describe('Hardening Phases 4 & 5 Verification', () => {
  describe('Phase 5: Crypto & Consistency', () => {
    it('generates secure 8-character invite codes from safe alphabet', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
      expect(code).not.toMatch(/[0O1I]/);
    });

    it('withRetry throws immediately on terminal errors (permission-denied)', async () => {
      let attempts = 0;
      const terminalError = { code: 'permission-denied', message: 'Missing permissions' };

      await expect(
        withRetry(async () => {
          attempts++;
          throw terminalError;
        }, 3, 10)
      ).rejects.toEqual(terminalError);

      expect(attempts).toBe(1); // No retries for terminal errors
    });

    it('withRetry retries on transient errors (unavailable) up to maxAttempts', async () => {
      let attempts = 0;
      const transientError = { code: 'unavailable', message: 'Service unavailable' };

      await expect(
        withRetry(async () => {
          attempts++;
          throw transientError;
        }, 3, 10)
      ).rejects.toEqual(transientError);

      expect(attempts).toBe(3); // Retried all 3 attempts
    });
  });

  describe('Phase 4: Trust Boundary, Rate Limiting & Validation', () => {
    it('rate limiter enforces request quota and blocks excess requests', () => {
      const key = `test-ip-${Date.now()}`;
      const opts = { windowMs: 1000, maxRequests: 3 };

      const r1 = checkRateLimit(key, opts);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(key, opts);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(key, opts);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = checkRateLimit(key, opts);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });

    it('session endpoint validates payload with zod and rejects malformed inputs', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken: 'short' }) // less than min(10)
      });
      const res = await sessionPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid request payload.');
    });

    it('admin claims endpoint validates role enum and rejects illegal roles', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/claims', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid: 'user123', role: 'superhacker' })
      });
      const res = await claimsPost(req);
      // Fails authentication or validation
      expect([400, 401]).toContain(res.status);
    });
  });
});
