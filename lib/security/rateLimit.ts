/**
 * Sliding-window rate limiter with cross-invocation persistence.
 *
 * Vercel serverless functions re-use the same Node.js process across
 * warm invocations but lose all module-level state on a cold start.
 * By attaching the store to `globalThis` we keep the map alive for
 * the entire lifetime of a warm container — the same technique Prisma
 * uses for its singleton client.  This makes rate limiting effective
 * within a single instance; for true multi-instance limiting at scale,
 * swap this store for an external KV (Upstash Redis, Vercel KV, etc.).
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Persist across hot-reloads (dev) and warm invocations (prod)
const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitRecord>;
};

if (!globalForRateLimit.__rateLimitStore) {
  globalForRateLimit.__rateLimitStore = new Map<string, RateLimitRecord>();
}

const rateLimitStore = globalForRateLimit.__rateLimitStore;

// Clean up expired records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}
