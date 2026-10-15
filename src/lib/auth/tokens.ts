import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** URL-safe random token. 32 bytes of entropy by default. */
export function createToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/**
 * Tokens are stored hashed. The raw value only ever lives in the user's cookie
 * or in a one-time invite link, so a database leak does not yield live sessions.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url')
}

export function hmac(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

/**
 * A coarse, non-reversible hint derived from an IP address, for rate limiting
 * and abuse investigation. Full addresses are never stored; the hint is keyed
 * with the application secret so it cannot be reversed by dictionary attack.
 */
export function ipHint(secret: string, ip: string | null | undefined): string | null {
  if (!ip) return null
  return hmac(secret, ip).slice(0, 16)
}
