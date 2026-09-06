/**
 * In-memory token-bucket rate limiter for sensitive authentication & admin endpoints.
 */

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

const hitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, maxRequests: 20 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();

  // Periodic pruning of stale records if the map grows large
  if (hitMap.size > 500) {
    for (const [k, v] of hitMap.entries()) {
      if (now > v.resetTime) {
        hitMap.delete(k);
      }
    }
  }

  const existing = hitMap.get(key);
  if (!existing || now > existing.resetTime) {
    const resetTime = now + options.windowMs;
    hitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: options.maxRequests - 1, resetTime };
  }

  if (existing.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }

  existing.count += 1;
  return { allowed: true, remaining: options.maxRequests - existing.count, resetTime: existing.resetTime };
}
