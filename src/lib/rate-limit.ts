/**
 * Best-effort in-memory rate limiter.
 *
 * This protects a single server instance against rapid repeated requests. On a
 * serverless platform (e.g. Vercel) each instance keeps its own counters, so it
 * is a speed bump, not a hard guarantee. Supabase Auth also rate-limits sign-in
 * attempts. For strict limits, add a shared store (Upstash/Postgres) later.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
}

export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

/** Test helper: clear all counters. */
export function resetRateLimits(): void {
  buckets.clear();
}
