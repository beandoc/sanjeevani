/**
 * Private helpers shared across the clinical-sync modules.
 *
 * Nothing here is re-exported from `index.ts` — these are implementation
 * details of the sync layer (identity/merge rules for reconciling the local
 * HealthRepository cache against Firestore, the retry wrapper for
 * intent-critical writes, and the current-uid lookup).
 */

import { Timestamp } from 'firebase/firestore';
import { auth } from '../client';
import { type ZaritEvaluationResult } from '@/lib/zarit-scale';
import { type FunctionEvaluationResult } from '@/lib/clinical/function-scale';
import { type DailyCareLog } from '@/lib/db/health-repository';
export function currentUid(): string | null {
  try {
    return auth?.currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code;
  if (!code || typeof code !== 'string') {
    const message = (err as { message?: string }).message || '';
    return /network|fetch|timeout|econnreset|offline/i.test(message);
  }
  const normalized = code.replace(/^(firestore|auth)\//, '').toLowerCase();
  // Immediately terminal errors — do not retry
  if (['permission-denied', 'unauthenticated', 'invalid-argument', 'not-found', 'already-exists', 'failed-precondition'].includes(normalized)) {
    return false;
  }
  // Standard transient retryable error codes
  return ['unavailable', 'deadline-exceeded', 'aborted', 'resource-exhausted', 'cancelled', 'internal'].includes(normalized);
}

/**
 * Retries an async operation up to `maxAttempts` times with exponential
 * back-off. Only retries on transient errors (network timeouts, unavailable, aborted);
 * terminal errors like permission-denied fail immediately without delay.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 400
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err) || attempt >= maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  throw lastErr;
}

export function assessmentIdentity(result: ZaritEvaluationResult): string {
  return `${result.completedAt}|${result.tier}|${result.totalScore}|${result.normalizedPercentage}`;
}

export function mergeZaritAssessments(
  local: ZaritEvaluationResult[],
  cloud: ZaritEvaluationResult[]
): ZaritEvaluationResult[] {
  const byIdentity = new Map<string, ZaritEvaluationResult>();
  for (const item of [...cloud, ...local]) {
    byIdentity.set(assessmentIdentity(item), item);
  }
  return Array.from(byIdentity.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

export function functionScoreIdentity(result: FunctionEvaluationResult): string {
  return `${result.recordedAt}|${result.barthelScore}|${result.lawtonScore}|${result.dependencyPercentage}`;
}

export function mergeFunctionScores(
  local: FunctionEvaluationResult[],
  cloud: FunctionEvaluationResult[]
): FunctionEvaluationResult[] {
  const byIdentity = new Map<string, FunctionEvaluationResult>();
  for (const item of [...cloud, ...local]) {
    byIdentity.set(functionScoreIdentity(item), item);
  }
  return Array.from(byIdentity.values()).sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
}

export function dailyCareLogIdentity(log: DailyCareLog): string {
  return log.id;
}

export function mergeDailyCareLogs(local: DailyCareLog[], cloud: DailyCareLog[]): DailyCareLog[] {
  const byId = new Map<string, DailyCareLog>();
  for (const item of [...local, ...cloud]) {
    const existing = byId.get(dailyCareLogIdentity(item));
    if (!existing || new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      byId.set(dailyCareLogIdentity(item), item);
    }
  }
  return Array.from(byId.values()).sort((a, b) => {
    const dateDelta = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDelta !== 0) return dateDelta;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}
