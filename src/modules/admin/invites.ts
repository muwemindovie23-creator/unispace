import 'server-only'

import { hashToken } from '@/lib/auth/tokens'
import { db } from '@/lib/db'

/**
 * Looks up an invitation that is still usable: it exists, has not been
 * accepted, and has not expired.
 *
 * The expiry comparison lives in the query rather than in the page so that the
 * page stays free of time-dependent logic during render.
 */
export async function findUsableInvite(token: string) {
  return db.adminInvite.findFirst({
    where: {
      tokenHash: hashToken(token),
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      adminUser: { select: { name: true, email: true } },
    },
  })
}
