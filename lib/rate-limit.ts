/**
 * lib/rate-limit.ts
 *
 * Simple in-memory rate limiter.
 * Uses a Map keyed by identifier (IP or user ID).
 * Suitable for single-instance deployments (dev, small VPS, Vercel Edge single-region).
 *
 * For multi-region production, swap this out for Redis-backed rate limiting
 * (e.g., @upstash/ratelimit) — the interface stays the same.
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

// Global store — persists across requests within the same process
const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS)

export type RateLimitOptions = {
  /** Unique identifier — typically IP address or user ID */
  key: string
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Window duration in milliseconds */
  window: number
}

export type RateLimitResult = {
  success: boolean
  /** How many requests remain in this window */
  remaining: number
  /** Unix timestamp (ms) when the window resets */
  resetAt: number
  /** Total requests allowed in the window */
  limit: number
}

/**
 * Check and increment the rate limit counter for a given key.
 *
 * @example
 * const result = rateLimit({ key: ip, limit: 60, window: 60_000 })
 * if (!result.success) {
 *   return new Response('Too Many Requests', { status: 429 })
 * }
 */
export function rateLimit({ key, limit, window }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // First request in this window (or window has expired)
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + window }
    store.set(key, newEntry)
    return {
      success: true,
      remaining: limit - 1,
      resetAt: newEntry.resetAt,
      limit,
    }
  }

  // Increment count within existing window
  entry.count += 1
  const remaining = Math.max(0, limit - entry.count)
  const success = entry.count <= limit

  return { success, remaining, resetAt: entry.resetAt, limit }
}

// ─── Preset helpers ───────────────────────────────────────────────────────────

/** 60 requests per minute for anonymous users */
export function anonymousRateLimit(ip: string, suffix = ''): RateLimitResult {
  return rateLimit({ key: `anon:${ip}${suffix}`, limit: 60, window: 60_000 })
}

/** 200 requests per minute for authenticated users */
export function authenticatedRateLimit(userId: string, suffix = ''): RateLimitResult {
  return rateLimit({ key: `auth:${userId}${suffix}`, limit: 200, window: 60_000 })
}

/** Export-specific rate limits (stricter) */
export function exportRateLimit(key: string, isAuthenticated: boolean): RateLimitResult {
  // Anonymous: 10 exports per hour; Authenticated: 50 exports per hour
  const limit = isAuthenticated ? 50 : 10
  const window = 60 * 60_000 // 1 hour
  return rateLimit({ key: `export:${key}`, limit, window })
}
