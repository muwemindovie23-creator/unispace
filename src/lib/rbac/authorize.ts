import { PERMISSIONS, type Permission } from './permissions'

export type ScopeType = 'PLATFORM' | 'UNIVERSITY' | 'CAMPUS'

export interface ActorAssignment {
  roleKey: string
  scopeType: ScopeType
  universityId: string | null
  campusId: string | null
  permissions: string[]
}

export interface Actor {
  id: string
  email: string
  name: string
  assignments: ActorAssignment[]
}

/**
 * The resource an action targets.
 *
 * `universityId` must always be supplied for university-scoped resources, and
 * must be the university the campus actually belongs to — resolve it from the
 * database, never from the request body. A null/undefined `campusId` means
 * university-wide content, which campus-scoped administrators may not touch.
 */
export interface ResourceScope {
  universityId?: string | null
  campusId?: string | null
}

export class AuthorizationError extends Error {
  readonly permission: Permission
  readonly scope: ResourceScope

  constructor(permission: Permission, scope: ResourceScope) {
    super('Not authorised')
    this.name = 'AuthorizationError'
    this.permission = permission
    this.scope = scope
  }
}

function assignmentCoversScope(assignment: ActorAssignment, scope: ResourceScope): boolean {
  switch (assignment.scopeType) {
    case 'PLATFORM':
      return true

    case 'UNIVERSITY':
      if (!assignment.universityId) return false
      // The target must belong to this university. A platform-wide resource
      // (no university) is out of a university admin's reach.
      return Boolean(scope.universityId) && scope.universityId === assignment.universityId

    case 'CAMPUS':
      if (!assignment.campusId) return false
      // Campus admins act only on content tied to their campus. University-wide
      // content (campusId === null) is deliberately excluded.
      if (!scope.campusId) return false
      if (scope.campusId !== assignment.campusId) return false
      // Defence in depth: if the caller also passed a university, it must match.
      if (
        scope.universityId &&
        assignment.universityId &&
        scope.universityId !== assignment.universityId
      ) {
        return false
      }
      return true

    default:
      return false
  }
}

/** True when the actor holds `permission` for the given resource scope. */
export function can(
  actor: Actor | null | undefined,
  permission: Permission,
  scope: ResourceScope = {},
): boolean {
  if (!actor) return false
  return actor.assignments.some(
    (assignment) =>
      assignment.permissions.includes(permission) && assignmentCoversScope(assignment, scope),
  )
}

/** Throws `AuthorizationError` unless the actor holds `permission` in scope. */
export function assertCan(
  actor: Actor | null | undefined,
  permission: Permission,
  scope: ResourceScope = {},
): asserts actor is Actor {
  if (!can(actor, permission, scope)) {
    throw new AuthorizationError(permission, scope)
  }
}

/** True when the actor holds at least one of the permissions in scope. */
export function canAny(
  actor: Actor | null | undefined,
  permissions: Permission[],
  scope: ResourceScope = {},
): boolean {
  return permissions.some((permission) => can(actor, permission, scope))
}

/**
 * A platform-wide actor sees everything. Otherwise the dashboard is limited to
 * the universities named by the actor's assignments.
 */
export function visibleUniverseOf(actor: Actor | null | undefined): {
  isPlatformWide: boolean
  universityIds: string[]
  campusIds: string[]
} {
  if (!actor) return { isPlatformWide: false, universityIds: [], campusIds: [] }

  const isPlatformWide = actor.assignments.some((a) => a.scopeType === 'PLATFORM')
  const universityIds = new Set<string>()
  const campusIds = new Set<string>()

  for (const assignment of actor.assignments) {
    if (assignment.universityId) universityIds.add(assignment.universityId)
    if (assignment.campusId) campusIds.add(assignment.campusId)
  }

  return {
    isPlatformWide,
    universityIds: [...universityIds],
    campusIds: [...campusIds],
  }
}

/**
 * Guards against privilege escalation: an administrator may only grant a role
 * whose permissions they already hold, within a scope they already cover, and
 * only if they hold `admin.assign_role` there.
 */
export function canGrantRole(
  actor: Actor | null | undefined,
  role: { permissions: string[] },
  scope: ResourceScope,
): boolean {
  if (!can(actor, PERMISSIONS.ADMIN_ASSIGN_ROLE, scope)) return false
  return role.permissions.every((permission) =>
    can(actor, permission as Permission, scope),
  )
}
