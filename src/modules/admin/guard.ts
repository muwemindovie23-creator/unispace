import 'server-only'

import { redirect } from 'next/navigation'

import { getActor } from '@/lib/auth/session'
import {
  assertCan,
  type Actor,
  type Permission,
  type ResourceScope,
} from '@/modules/admin/rbac'

/**
 * Entry point for every administrator page and action.
 *
 * Authorisation is checked on the server, against the database-backed
 * assignment — never against anything the client sent. Hiding a button in the
 * dashboard is a convenience, not a control.
 */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor()
  if (!actor) redirect('/admin/login')
  return actor
}

/** Requires a signed-in administrator who holds `permission` in `scope`. */
export async function requirePermission(
  permission: Permission,
  scope: ResourceScope = {},
): Promise<Actor> {
  const actor = await requireActor()
  assertCan(actor, permission, scope)
  return actor
}
