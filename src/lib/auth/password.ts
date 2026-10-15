import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

// Deliberately a Node built-in: no native module to compile, and scrypt is a
// memory-hard KDF suitable for password storage.
const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 }
const KEY_LENGTH = 64
const SALT_LENGTH = 16

/** Returns a self-describing hash string: `scrypt$N$r$p$salt$key` (base64). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const key = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, PARAMS)
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$')
}

/**
 * Constant-time verification. Returns false rather than throwing on malformed
 * stored values so a corrupted row cannot turn into a 500 that leaks detail.
 */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false

  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const N = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  let salt: Buffer
  let expected: Buffer
  try {
    salt = Buffer.from(parts[4], 'base64')
    expected = Buffer.from(parts[5], 'base64')
  } catch {
    return false
  }
  if (salt.length === 0 || expected.length === 0) return false

  try {
    const actual = await scrypt(password.normalize('NFKC'), salt, expected.length, {
      N,
      r,
      p,
      maxmem: PARAMS.maxmem,
    })
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

/**
 * Minimum password policy for administrator accounts. Length does most of the
 * work; we reject the obvious rather than demanding unmemorable complexity.
 */
export function describePasswordProblems(password: string): string[] {
  const problems: string[] = []
  if (password.length < 12) problems.push('Use at least 12 characters.')
  if (password.length > 200) problems.push('Use at most 200 characters.')
  if (/^\s|\s$/.test(password)) problems.push('Remove leading or trailing spaces.')
  if (/^(.)\1+$/.test(password)) problems.push('Do not repeat a single character.')
  const lowered = password.toLowerCase()
  if (['password', 'unispace', '123456', 'qwerty'].some((weak) => lowered.includes(weak))) {
    problems.push('Avoid common words such as "password" or "unispace".')
  }
  return problems
}
