import 'server-only'

import { cookies, headers } from 'next/headers'

import { db } from '@/lib/db'
import { getEnv, isProduction } from '@/lib/env'
import type { Actor, ActorAssignment, ScopeType } from '@/lib/rbac/authorize'

import { createToken, hashToken, hmac, ipHint, safeEquals } from './tokens'

export const SESSION_COOKIE = 'unispace_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours
const SESSION_REFRESH_AFTER_MS = 1000 * 60 * 15

export interface SessionContext {
  sessionId: string
  actor: Actor
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction(),
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

/** Creates a session row and sets the httpOnly cookie. */
export async function createSession(adminUserId: string, epoch: number): Promise<void> {
  const env = getEnv()
  const requestHeaders = await headers()
  const token = createToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const forwardedFor = requestHeaders.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() ?? null

  await db.adminSession.create({
    data: {
      adminUserId,
      tokenHash: hashToken(token),
      epoch,
      csrfSecret: createToken(16),
      userAgent: requestHeaders.get('user-agent')?.slice(0, 255) ?? null,
      ipHint: ipHint(env.AUTH_SECRET, ip),
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(Math.floor(SESSION_TTL_MS / 1000)))
}

/** Revokes the current session and clears the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await db.adminSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  cookieStore.set(SESSION_COOKIE, '', cookieOptions(0))
}

/** Signs every session of an administrator out (suspension, role change, reset). */
export async function revokeAllSessions(adminUserId: string): Promise<void> {
  await db.$transaction([
    db.adminUser.update({
      where: { id: adminUserId },
      data: { sessionEpoch: { increment: 1 } },
    }),
    db.adminSession.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])
}

function toActorAssignments(
  assignments: {
    scopeType: ScopeType
    universityId: string | null
    campusId: string | null
    role: { key: string; permissions: string[] }
  }[],
): ActorAssignment[] {
  return assignments.map((assignment) => ({
    roleKey: assignment.role.key,
    scopeType: assignment.scopeType,
    universityId: assignment.universityId,
    campusId: assignment.campusId,
    permissions: assignment.role.permissions,
  }))
}

/**
 * Resolves the signed-in administrator from the session cookie, or null.
 *
 * Validates, in order: cookie present, session row exists, not revoked, not
 * expired, account active, and the session epoch still matches the account's.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      adminUser: {
        include: {
          assignments: {
            where: {
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: { role: true },
          },
        },
      },
    },
  })

  if (!session) return null
  if (session.revokedAt) return null
  if (session.expiresAt.getTime() <= Date.now()) return null

  const user = session.adminUser
  if (user.status !== 'ACTIVE') return null
  if (session.epoch !== user.sessionEpoch) return null

  if (Date.now() - session.lastSeenAt.getTime() > SESSION_REFRESH_AFTER_MS) {
    await db.adminSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    })
  }

  return {
    sessionId: session.id,
    actor: {
      id: user.id,
      email: user.email,
      name: user.name,
      assignments: toActorAssignments(session.adminUser.assignments),
    },
  }
}

export async function getActor(): Promise<Actor | null> {
  return (await getSessionContext())?.actor ?? null
}

// ---------------------------------------------------------------------------
// CSRF: double-submit token bound to the session
// ---------------------------------------------------------------------------

/** Token to embed in admin forms. Derived from the session's stored secret. */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, csrfSecret: true, revokedAt: true },
  })
  if (!session || session.revokedAt) return null

  return hmac(session.csrfSecret, session.id)
}

export async function assertCsrfToken(submitted: string | null | undefined): Promise<void> {
  const expected = await getCsrfToken()
  if (!expected || !submitted || !safeEquals(expected, submitted)) {
    throw new Error('Invalid or missing CSRF token')
  }
}

/**
 * Origin check for mutating route handlers. Server Actions already carry
 * Next.js' own origin protection; public POST endpoints do not.
 */
export async function assertSameOrigin(): Promise<void> {
  const requestHeaders = await headers()
  const origin = requestHeaders.get('origin')
  // Same-origin form posts from some clients omit Origin; fall back to Referer.
  const referer = requestHeaders.get('referer')
  const candidate = origin ?? (referer ? new URL(referer).origin : null)

  if (!candidate) throw new Error('Missing request origin')

  const allowed = new Set([getEnv().APP_URL])
  const host = requestHeaders.get('host')
  if (host) {
    allowed.add(`https://${host}`)
    if (!isProduction()) allowed.add(`http://${host}`)
  }

  if (!allowed.has(candidate)) throw new Error('Cross-origin request rejected')
}
