import 'server-only'

import { headers } from 'next/headers'

import { db } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { ipHint } from '@/lib/auth/tokens'

/**
 * Fixed-window rate limiting backed by the database.
 *
 * Chosen over an in-memory counter because the app runs on serverless
 * instances where memory is not shared, and over Redis because it would be an
 * extra service to operate for a volume this small. Windows are coarse and the
 * counters expire, so the table stays tiny.
 *
 * The caller's identity is a keyed, truncated hash of the IP address — we never
 * store a visitor's address to rate limit them.
 */

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function callerHint(): Promise<string> {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  const ip =
    forwardedFor?.split(',')[0]?.trim() ??
    requestHeaders.get('x-real-ip')?.trim() ??
    null
  return ipHint(getEnv().AUTH_SECRET, ip) ?? 'unknown'
}

/**
 * @param bucket   What is being limited, e.g. 'admin-login' or 'poll-vote'.
 * @param limit    Requests allowed per window.
 * @param windowMs Window length in milliseconds.
 * @param subject  Defaults to the caller hint; pass a value to scope the limit
 *                 more narrowly (for example per poll, or per email address).
 */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
  subject?: string,
): Promise<RateLimitResult> {
  const who = subject ?? (await callerHint())
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs
  const windowKey = `${who}:${windowStart}`
  const resetAt = new Date(windowStart + windowMs)

  const counter = await db.rateLimitCounter.upsert({
    where: { bucket_windowKey: { bucket, windowKey } },
    update: { count: { increment: 1 } },
    create: { bucket, windowKey, count: 1, expiresAt: resetAt },
  })

  // Opportunistic cleanup; cheap because the index is on expiresAt.
  if (counter.count === 1 && Math.random() < 0.02) {
    await db.rateLimitCounter
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => undefined)
  }

  return {
    allowed: counter.count <= limit,
    remaining: Math.max(0, limit - counter.count),
    resetAt,
  }
}
