/**
 * Provisions the first Super Admin.
 *
 * Security properties this script is built around:
 *  - No password is ever written in source control, a seed file or the docs.
 *  - The script does not set a password at all. It creates an INVITED account
 *    and prints a single-use invitation link, valid for 48 hours, which the
 *    person opens to choose their own password.
 *  - The invitation token is stored only as a SHA-256 hash, so a database copy
 *    does not let anyone take over the account.
 *  - Re-running it for the same email reissues a link rather than creating a
 *    second account, and it never resets an existing password.
 *
 * Usage:
 *   npm run provision:super-admin -- --email admin@example.org --name "Full Name"
 */

// Loads .env before the Prisma client reads DATABASE_URL.
import 'dotenv/config'

import { PrismaClient } from '@prisma/client'

import { SYSTEM_ROLES } from '../src/lib/rbac/permissions'

const db = new PrismaClient()

const INVITE_TTL_HOURS = 48

function readArgs(): { email: string; name: string } {
  const args = process.argv.slice(2)
  const read = (flag: string) => {
    const index = args.indexOf(flag)
    return index >= 0 ? args[index + 1] : undefined
  }

  const email = read('--email')?.trim().toLowerCase()
  const name = read('--name')?.trim()

  if (!email || !name) {
    console.error(
      'Usage: npm run provision:super-admin -- --email <address> --name "<full name>"',
    )
    process.exit(1)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`"${email}" does not look like an email address.`)
    process.exit(1)
  }

  return { email, name }
}

async function main() {
  const { email, name } = readArgs()
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

  const { createToken, hashToken } = await import('../src/lib/auth/tokens')

  const role = await db.adminRole.findUnique({ where: { key: SYSTEM_ROLES.SUPER_ADMIN.key } })
  if (!role) {
    console.error('The super_admin role is missing. Run `npm run db:seed` first.')
    process.exit(1)
  }

  const existing = await db.adminUser.findUnique({ where: { email } })
  if (existing?.passwordHash) {
    console.error(
      `${email} already has a password set. Use the dashboard to manage this account, ` +
        'or reset it there rather than re-provisioning.',
    )
    process.exit(1)
  }

  const admin =
    existing ??
    (await db.adminUser.create({
      data: { email, name, status: 'INVITED' },
    }))

  // A platform assignment leaves universityId and campusId NULL, which Prisma
  // cannot address through the compound unique key, so look it up explicitly.
  const existingAssignment = await db.adminAssignment.findFirst({
    where: {
      adminUserId: admin.id,
      roleId: role.id,
      scopeType: 'PLATFORM',
      universityId: null,
      campusId: null,
    },
    select: { id: true },
  })

  if (existingAssignment) {
    await db.adminAssignment.update({
      where: { id: existingAssignment.id },
      data: { revokedAt: null },
    })
  } else {
    await db.adminAssignment.create({
      data: { adminUserId: admin.id, roleId: role.id, scopeType: 'PLATFORM' },
    })
  }

  // Any earlier unused invitation for this account is retired.
  await db.adminInvite.deleteMany({ where: { adminUserId: admin.id, acceptedAt: null } })

  const token = createToken(32)
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000)

  await db.adminInvite.create({
    data: { adminUserId: admin.id, tokenHash: hashToken(token), expiresAt },
  })

  await db.auditLog.create({
    data: {
      actorEmail: 'cli:provision-super-admin',
      action: 'admin.super_admin_provisioned',
      targetType: 'AdminUser',
      targetId: admin.id,
      metadata: { email, viaCli: true },
    },
  })

  console.log('\nSuper Admin invitation created.')
  console.log(`  Account:  ${name} <${email}>`)
  console.log(`  Expires:  ${expiresAt.toISOString()} (${INVITE_TTL_HOURS} hours)`)
  console.log('\nOpen this link once, in a browser, to set the password:\n')
  console.log(`  ${appUrl}/admin/invite/${token}\n`)
  console.log('The link is shown here only. It is stored hashed and cannot be recovered.')
  console.log('Send it over a channel you trust, and do not paste it into shared logs.\n')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
