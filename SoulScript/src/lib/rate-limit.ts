type WindowUnit = "minute" | "hour" | "day";

interface RateLimitConfig {
  /** Max number of requests allowed in the window */
  max: number;
  /** Time window unit */
  window: WindowUnit;
  /** Unique endpoint identifier (e.g. "analyze:post", "profile:patch") */
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: Date;
}

const WINDOW_MS: Record<WindowUnit, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

/** In-memory counter store: key = `${userId}:${endpoint}`, value = { count, resetAt } */
const counters = new Map<string, { count: number; resetAt: number }>();

/**
 * Check whether `userId` is under their rate limit for the given endpoint.
 *
 * Uses an in-memory Map — counters reset on server restart. For a personal
 * journaling app this is sufficient; swap to Upstash Redis for serverless
 * production by changing only this function body.
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig,
): RateLimitResult {
  const { max, window: unit, endpoint } = config;
  const key = `${userId}:${endpoint}`;
  const now = Date.now();

  const entry = counters.get(key);

  // No prior request or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    counters.set(key, { count: 1, resetAt: now + WINDOW_MS[unit] });
    return { allowed: true, remaining: max - 1, reset: new Date(now + WINDOW_MS[unit]) };
  }

  // Window still active — check
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, reset: new Date(entry.resetAt) };
  }

  // Under limit — increment
  entry.count++;
  return { allowed: true, remaining: max - entry.count, reset: new Date(entry.resetAt) };
}

/** Clear all rate-limit counters. Useful in tests to isolate scenarios. */
export function resetRateLimits(): void {
  counters.clear();
}
