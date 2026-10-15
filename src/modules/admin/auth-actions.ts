'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { hashToken } from '@/lib/auth/tokens'
import { describePasswordProblems, hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSession, destroySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { recordAudit } from '@/lib/audit'

export interface FormState {
  error?: string
  ok?: boolean
}

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
})

const MAX_FAILED_LOGINS = 8
const LOCKOUT_MS = 15 * 60 * 1000

/**
 * Sign-in deliberately returns one generic message for every failure — unknown
 * address, wrong password, suspended account — so the form cannot be used to
 * discover which email addresses have administrator accounts.
 */
export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  const GENERIC = 'Those details did not work. Check them and try again.'
  if (!parsed.success) return { error: GENERIC }

  const { email, password } = parsed.data

  // Two limits: one on the caller, one on the address being targeted.
  const [byCaller, byEmail] = await Promise.all([
    rateLimit('admin-login-ip', 20, 15 * 60 * 1000),
    rateLimit('admin-login-email', 10, 15 * 60 * 1000, email),
  ])
  if (!byCaller.allowed || !byEmail.allowed) {
    return { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' }
  }

  const user = await db.adminUser.findUnique({ where: { email } })

  // Always run a verification so the response time does not reveal whether the
  // address exists.
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? null)

  if (!user || !passwordMatches) {
    if (user) {
      const failedLoginCount = user.failedLoginCount + 1
      await db.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          lockedUntil:
            failedLoginCount >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
      })
    }
    return { error: GENERIC }
  }

  if (user.status !== 'ACTIVE') return { error: GENERIC }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { error: 'This account is temporarily locked. Please try again later.' }
  }

  await db.adminUser.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  })

  await createSession(user.id, user.sessionEpoch)
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'admin.signed_in',
    targetType: 'AdminUser',
    targetId: user.id,
  })

  redirect('/admin')
}

export async function signOutAction(): Promise<void> {
  await destroySession()
  redirect('/admin/login')
}

const acceptInviteSchema = z
  .object({
    token: z.string().min(10).max(200),
    password: z.string().min(12).max(200),
    confirmPassword: z.string().min(1).max(200),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  })

/**
 * Accepts an invitation and sets the account's first password. The invitation
 * is single-use: it is marked accepted inside the same transaction that writes
 * the password hash and activates the account.
 */
export async function acceptInviteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const { token, password } = parsed.data

  const limit = await rateLimit('admin-invite', 10, 15 * 60 * 1000)
  if (!limit.allowed) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' }
  }

  const problems = describePasswordProblems(password)
  if (problems.length > 0) return { error: problems.join(' ') }

  const invite = await db.adminInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: true },
  })

  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() <= Date.now()) {
    return { error: 'This invitation link is no longer valid. Ask for a new one.' }
  }

  const passwordHash = await hashPassword(password)

  await db.$transaction([
    db.adminUser.update({
      where: { id: invite.adminUserId },
      data: {
        passwordHash,
        status: 'ACTIVE',
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    db.adminInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ])

  await recordAudit({
    actorId: invite.adminUserId,
    actorEmail: invite.adminUser.email,
    action: 'admin.invite_accepted',
    targetType: 'AdminUser',
    targetId: invite.adminUserId,
  })

  const user = await db.adminUser.findUniqueOrThrow({ where: { id: invite.adminUserId } })
  await createSession(user.id, user.sessionEpoch)

  redirect('/admin')
}
