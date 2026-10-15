/**
 * Single import point for authorisation inside the admin module, so feature
 * code never reaches past it into several different files.
 */
export {
  assertCan,
  can,
  canAny,
  canGrantRole,
  visibleUniverseOf,
  AuthorizationError,
  type Actor,
  type ActorAssignment,
  type ResourceScope,
  type ScopeType,
} from '@/lib/rbac/authorize'

export {
  PERMISSIONS,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  SYSTEM_ROLES,
  type Permission,
  type SystemRoleKey,
} from '@/lib/rbac/permissions'
