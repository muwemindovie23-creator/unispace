import 'server-only'

import { db } from '@/lib/db'
import { visibleUniverseOf, type Actor } from '@/modules/admin/rbac'

export interface ManageableCampus {
  id: string
  name: string
  slug: string
  isPublished: boolean
}

export interface ManageableUniversity {
  id: string
  slug: string
  name: string
  acronym: string
  isPublished: boolean
  profileStatus: 'COMING_SOON' | 'IN_PROGRESS' | 'COMPLETE'
  officialWebsite: string | null
  officialWebsiteVerifiedAt: Date | null
  campuses: ManageableCampus[]
  /** True when the actor reaches the whole university, not just some campuses. */
  isUniversityWide: boolean
}

/**
 * The universities and campuses this administrator may work in.
 *
 * The scope filter is applied in the database query itself, so a campus admin
 * never loads another campus's rows into memory in the first place.
 */
export async function listManageableUniversities(
  actor: Actor,
): Promise<ManageableUniversity[]> {
  const scope = visibleUniverseOf(actor)

  if (!scope.isPlatformWide && scope.universityIds.length === 0 && scope.campusIds.length === 0) {
    return []
  }

  const universities = await db.university.findMany({
    where: scope.isPlatformWide
      ? {}
      : {
          OR: [
            { id: { in: scope.universityIds } },
            { campuses: { some: { id: { in: scope.campusIds } } } },
          ],
        },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      acronym: true,
      isPublished: true,
      profileStatus: true,
      officialWebsite: true,
      officialWebsiteVerifiedAt: true,
      campuses: {
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, isPublished: true },
      },
    },
  })

  return universities.map((university) => {
    const isUniversityWide =
      scope.isPlatformWide || scope.universityIds.includes(university.id)

    return {
      ...university,
      isUniversityWide,
      // A campus-scoped administrator only sees the campuses they hold.
      campuses: isUniversityWide
        ? university.campuses
        : university.campuses.filter((campus) => scope.campusIds.includes(campus.id)),
    }
  })
}

/** Resolves a campus to its university — never trust a client-supplied pair. */
export async function resolveCampusScope(
  campusId: string,
): Promise<{ universityId: string; campusId: string } | null> {
  const campus = await db.campus.findUnique({
    where: { id: campusId },
    select: { id: true, universityId: true },
  })
  if (!campus) return null
  return { universityId: campus.universityId, campusId: campus.id }
}

/** Recent audit entries, newest first. */
export async function listRecentAudit(limit = 10) {
  return db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      actorEmail: true,
      targetType: true,
      createdAt: true,
    },
  })
}
