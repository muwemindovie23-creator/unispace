import { describe, expect, it } from 'vitest'

import {
  can,
  canGrantRole,
  visibleUniverseOf,
  type Actor,
} from '@/lib/rbac/authorize'
import { PERMISSIONS, SYSTEM_ROLES } from '@/lib/rbac/permissions'

const UNIMA = 'university-unima'
const MUST = 'university-must'
const CHIRUNGA = 'campus-chirunga'
const NDIRANDE = 'campus-ndirande'

function actorWith(assignments: Actor['assignments']): Actor {
  return { id: 'admin-1', email: 'a@example.org', name: 'Test Admin', assignments }
}

const superAdmin = actorWith([
  {
    roleKey: 'super_admin',
    scopeType: 'PLATFORM',
    universityId: null,
    campusId: null,
    permissions: [...SYSTEM_ROLES.SUPER_ADMIN.permissions],
  },
])

const universityAdmin = actorWith([
  {
    roleKey: 'university_admin',
    scopeType: 'UNIVERSITY',
    universityId: UNIMA,
    campusId: null,
    permissions: [...SYSTEM_ROLES.UNIVERSITY_ADMIN.permissions],
  },
])

const campusAdmin = actorWith([
  {
    roleKey: 'campus_admin',
    scopeType: 'CAMPUS',
    universityId: UNIMA,
    campusId: CHIRUNGA,
    permissions: [...SYSTEM_ROLES.CAMPUS_ADMIN.permissions],
  },
])

describe('super admin', () => {
  it('holds every permission everywhere', () => {
    expect(can(superAdmin, PERMISSIONS.PLATFORM_SETTINGS_MANAGE)).toBe(true)
    expect(can(superAdmin, PERMISSIONS.EVENT_PUBLISH, { universityId: MUST })).toBe(true)
    expect(
      can(superAdmin, PERMISSIONS.TIP_PUBLISH, { universityId: MUST, campusId: NDIRANDE }),
    ).toBe(true)
  })
})

describe('university admin', () => {
  it('can act within its own university, university-wide and per campus', () => {
    expect(can(universityAdmin, PERMISSIONS.EVENT_PUBLISH, { universityId: UNIMA })).toBe(true)
    expect(
      can(universityAdmin, PERMISSIONS.EVENT_PUBLISH, {
        universityId: UNIMA,
        campusId: CHIRUNGA,
      }),
    ).toBe(true)
  })

  it('cannot reach another university (horizontal escalation)', () => {
    expect(can(universityAdmin, PERMISSIONS.EVENT_PUBLISH, { universityId: MUST })).toBe(false)
    expect(
      can(universityAdmin, PERMISSIONS.EVENT_PUBLISH, {
        universityId: MUST,
        campusId: NDIRANDE,
      }),
    ).toBe(false)
  })

  it('cannot reach platform-wide settings (vertical escalation)', () => {
    expect(can(universityAdmin, PERMISSIONS.PLATFORM_SETTINGS_MANAGE)).toBe(false)
    expect(can(universityAdmin, PERMISSIONS.ADMIN_ROLE_MANAGE, { universityId: UNIMA })).toBe(false)
    expect(can(universityAdmin, PERMISSIONS.UNIVERSITY_THEME_PUBLISH, { universityId: UNIMA })).toBe(
      false,
    )
  })
})

describe('campus admin', () => {
  it('can act on its own campus', () => {
    expect(
      can(campusAdmin, PERMISSIONS.TIP_PUBLISH, { universityId: UNIMA, campusId: CHIRUNGA }),
    ).toBe(true)
  })

  it('cannot act on another campus of the same university', () => {
    expect(
      can(campusAdmin, PERMISSIONS.TIP_PUBLISH, { universityId: UNIMA, campusId: NDIRANDE }),
    ).toBe(false)
  })

  it('cannot act on a campus of another university', () => {
    expect(
      can(campusAdmin, PERMISSIONS.TIP_PUBLISH, { universityId: MUST, campusId: NDIRANDE }),
    ).toBe(false)
  })

  it('cannot edit university-wide content, which has no campus', () => {
    expect(can(campusAdmin, PERMISSIONS.TIP_PUBLISH, { universityId: UNIMA })).toBe(false)
    expect(can(campusAdmin, PERMISSIONS.TIP_PUBLISH, { universityId: UNIMA, campusId: null })).toBe(
      false,
    )
  })

  it('rejects a mismatched university/campus pair', () => {
    // A client claiming its campus belongs to a different university must fail.
    expect(
      can(campusAdmin, PERMISSIONS.TIP_PUBLISH, { universityId: MUST, campusId: CHIRUNGA }),
    ).toBe(false)
  })

  it('holds none of the platform or university administration permissions', () => {
    expect(can(campusAdmin, PERMISSIONS.PLATFORM_SETTINGS_MANAGE)).toBe(false)
    expect(can(campusAdmin, PERMISSIONS.ADMIN_INVITE, { universityId: UNIMA })).toBe(false)
    expect(can(campusAdmin, PERMISSIONS.ADMIN_ASSIGN_ROLE, { universityId: UNIMA })).toBe(false)
    expect(
      can(campusAdmin, PERMISSIONS.UNIVERSITY_THEME_EDIT, { universityId: UNIMA }),
    ).toBe(false)
  })
})

describe('anonymous visitors', () => {
  it('hold no permissions at all', () => {
    expect(can(null, PERMISSIONS.EVENT_READ, { universityId: UNIMA })).toBe(false)
    expect(can(undefined, PERMISSIONS.PLATFORM_AUDIT_READ)).toBe(false)
  })
})

describe('role granting', () => {
  const superAdminRole = { permissions: [...SYSTEM_ROLES.SUPER_ADMIN.permissions] }
  const campusAdminRole = { permissions: [...SYSTEM_ROLES.CAMPUS_ADMIN.permissions] }

  it('lets a super admin grant any role', () => {
    expect(canGrantRole(superAdmin, campusAdminRole, { universityId: UNIMA })).toBe(true)
    expect(canGrantRole(superAdmin, superAdminRole, {})).toBe(true)
  })

  it('stops an administrator granting permissions they do not hold', () => {
    expect(canGrantRole(universityAdmin, superAdminRole, { universityId: UNIMA })).toBe(false)
  })

  it('stops a campus admin granting roles at all', () => {
    expect(
      canGrantRole(campusAdmin, campusAdminRole, { universityId: UNIMA, campusId: CHIRUNGA }),
    ).toBe(false)
  })
})

describe('visible universe', () => {
  it('reports platform-wide access for a super admin', () => {
    expect(visibleUniverseOf(superAdmin).isPlatformWide).toBe(true)
  })

  it('lists only the assigned scopes for a campus admin', () => {
    const scope = visibleUniverseOf(campusAdmin)
    expect(scope.isPlatformWide).toBe(false)
    expect(scope.universityIds).toEqual([UNIMA])
    expect(scope.campusIds).toEqual([CHIRUNGA])
  })
})

describe('system role definitions', () => {
  it('gives only the super admin role platform scope', () => {
    for (const role of Object.values(SYSTEM_ROLES)) {
      const scopes: readonly string[] = role.allowedScopes
      if (role.key === 'super_admin') {
        expect(scopes).toContain('PLATFORM')
      } else {
        expect(scopes).not.toContain('PLATFORM')
      }
    }
  })

  it('keeps settings, audit and role management out of every non-super role', () => {
    const reserved = [
      PERMISSIONS.PLATFORM_SETTINGS_MANAGE,
      PERMISSIONS.PLATFORM_AUDIT_READ,
      PERMISSIONS.ADMIN_ROLE_MANAGE,
      PERMISSIONS.UNIVERSITY_CREATE,
      PERMISSIONS.UNIVERSITY_DELETE,
    ]

    for (const role of Object.values(SYSTEM_ROLES)) {
      if (role.key === 'super_admin') continue
      const permissions: readonly string[] = role.permissions
      for (const permission of reserved) {
        expect(permissions).not.toContain(permission)
      }
    }
  })
})
