import { ApiError } from './api';

// Fixed-window in-memory rate limiter. On Vercel every serverless instance keeps
// its own window, which still blunts brute-force and spam bursts. For strict
// global limits, swap the Map for Upstash Redis behind the same function.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    entry.count += 1;
    if (entry.count > limit) {
      throw new ApiError(429, 'Too many requests. Please wait a moment and try again.');
    }
  }
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
}
