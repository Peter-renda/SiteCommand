/**
 * Minimal in-memory sliding-window rate limiter for public, unauthenticated
 * endpoints that fan out to paid upstreams (the Career Center's Gemini-backed
 * tools). Per serverless instance only — an instance restart resets counters —
 * which is fine here: the goal is stopping casual abuse of the API key from a
 * single client, not precise global quotas.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
const MAX_BUCKETS = 5000;

/**
 * Returns true when the caller is within `limit` requests per `windowMs` for
 * the given key (typically `${routeName}:${ip}`), false when throttled.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Opportunistic cleanup so the map can't grow without bound.
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, w] of buckets) {
        if (w.resetAt <= now) buckets.delete(k);
      }
      // Still full of live windows? Drop the oldest entries.
      if (buckets.size >= MAX_BUCKETS) {
        const excess = buckets.size - MAX_BUCKETS + 1;
        let dropped = 0;
        for (const k of buckets.keys()) {
          buckets.delete(k);
          if (++dropped >= excess) break;
        }
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client IP for rate-limit keying (Vercel/proxy aware). */
export function clientIpFrom(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") || "unknown";
}
