import 'server-only'

import { db } from '@/lib/db'
import { DEFAULT_THEME, type ThemeTokens } from '@/lib/theme/tokens'

/**
 * Public-facing shapes. Query helpers in this file return only fields that are
 * safe to render to anyone — no administrator identities, no private contact
 * details, no submission payloads.
 */

export interface UniversityCard {
  id: string
  slug: string
  name: string
  acronym: string
  shortDescription: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  profileStatus: 'COMING_SOON' | 'IN_PROGRESS' | 'COMPLETE'
  campusCount: number
  theme: ThemeTokens
}

const THEME_FIELDS = {
  primaryColor: true,
  primaryContrast: true,
  secondaryColor: true,
  secondaryContrast: true,
  accentColor: true,
  accentContrast: true,
  backgroundColor: true,
  surfaceColor: true,
  surfaceMutedColor: true,
  textPrimaryColor: true,
  textSecondaryColor: true,
  borderColor: true,
  highlightColor: true,
  radius: true,
  decorativePatternUrl: true,
} as const

function resolveTheme(themes: Partial<ThemeTokens>[] | undefined): ThemeTokens {
  return { ...DEFAULT_THEME, ...(themes?.[0] ?? {}) }
}

/** Every published university, in the order admins chose. */
export async function listPublishedUniversities(): Promise<UniversityCard[]> {
  const universities = await db.university.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      acronym: true,
      shortDescription: true,
      logoUrl: true,
      coverImageUrl: true,
      profileStatus: true,
      themes: { where: { variant: 'PUBLISHED' }, select: THEME_FIELDS, take: 1 },
      _count: { select: { campuses: { where: { isPublished: true } } } },
    },
  })

  return universities.map((university) => ({
    id: university.id,
    slug: university.slug,
    name: university.name,
    acronym: university.acronym,
    shortDescription: university.shortDescription,
    logoUrl: university.logoUrl,
    coverImageUrl: university.coverImageUrl,
    profileStatus: university.profileStatus,
    campusCount: university._count.campuses,
    theme: resolveTheme(university.themes),
  }))
}

export interface UniversityDetail extends UniversityCard {
  longDescription: string | null
  officialWebsite: string | null
  officialWebsiteVerifiedAt: Date | null
  city: string | null
  campuses: {
    id: string
    slug: string
    name: string
    kind: string | null
    description: string | null
    city: string | null
    isPrimary: boolean
    profileStatus: 'COMING_SOON' | 'IN_PROGRESS' | 'COMPLETE'
  }[]
  officialLinks: {
    id: string
    label: string
    url: string
    description: string | null
    verifiedAt: Date | null
  }[]
  enabledSections: { sectionKey: string; title: string | null; displayOrder: number }[]
}

export async function getPublishedUniversityBySlug(
  slug: string,
): Promise<UniversityDetail | null> {
  const university = await db.university.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      slug: true,
      name: true,
      acronym: true,
      shortDescription: true,
      longDescription: true,
      logoUrl: true,
      coverImageUrl: true,
      officialWebsite: true,
      officialWebsiteVerifiedAt: true,
      city: true,
      profileStatus: true,
      themes: { where: { variant: 'PUBLISHED' }, select: THEME_FIELDS, take: 1 },
      campuses: {
        where: { isPublished: true },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          slug: true,
          name: true,
          kind: true,
          description: true,
          city: true,
          isPrimary: true,
          profileStatus: true,
        },
      },
      officialLinks: {
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, label: true, url: true, description: true, verifiedAt: true },
      },
      homepageSections: {
        where: { isEnabled: true, campusId: null },
        orderBy: { displayOrder: 'asc' },
        select: { sectionKey: true, title: true, displayOrder: true },
      },
      _count: { select: { campuses: { where: { isPublished: true } } } },
    },
  })

  if (!university) return null

  return {
    id: university.id,
    slug: university.slug,
    name: university.name,
    acronym: university.acronym,
    shortDescription: university.shortDescription,
    longDescription: university.longDescription,
    logoUrl: university.logoUrl,
    coverImageUrl: university.coverImageUrl,
    officialWebsite: university.officialWebsite,
    officialWebsiteVerifiedAt: university.officialWebsiteVerifiedAt,
    city: university.city,
    profileStatus: university.profileStatus,
    campusCount: university._count.campuses,
    theme: resolveTheme(university.themes),
    campuses: university.campuses,
    officialLinks: university.officialLinks,
    enabledSections: university.homepageSections,
  }
}

/** Slugs for static generation and the sitemap. */
export async function listPublishedUniversitySlugs(): Promise<string[]> {
  const rows = await db.university.findMany({
    where: { isPublished: true },
    select: { slug: true },
  })
  return rows.map((row) => row.slug)
}

export interface UniversityOfficialLinks {
  id: string
  slug: string
  name: string
  acronym: string
  officialWebsite: string | null
  officialWebsiteVerifiedAt: Date | null
  links: { id: string; label: string; url: string; verifiedAt: Date | null }[]
}

/**
 * Powers the platform-wide directory of official university websites. UniSpace
 * links out for institutional information rather than reproducing it.
 */
export async function listOfficialWebsites(): Promise<UniversityOfficialLinks[]> {
  const universities = await db.university.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      acronym: true,
      officialWebsite: true,
      officialWebsiteVerifiedAt: true,
      officialLinks: {
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, label: true, url: true, verifiedAt: true },
      },
    },
  })

  return universities.map(({ officialLinks, ...university }) => ({
    ...university,
    links: officialLinks,
  }))
}

export interface CampusDetail {
  id: string
  slug: string
  name: string
  kind: string | null
  description: string | null
  city: string | null
  isPrimary: boolean
  profileStatus: 'COMING_SOON' | 'IN_PROGRESS' | 'COMPLETE'
  university: UniversityDetail
  /** Sections for this campus, falling back to the university's own choice. */
  enabledSections: { sectionKey: string; title: string | null; displayOrder: number }[]
}

/**
 * A single campus's public page. Returns null unless both the campus and its
 * university are published, so an unpublished university cannot be reached
 * sideways through one of its campuses.
 */
export async function getPublishedCampusBySlug(
  universitySlug: string,
  campusSlug: string,
): Promise<CampusDetail | null> {
  const university = await getPublishedUniversityBySlug(universitySlug)
  if (!university) return null

  const campus = await db.campus.findFirst({
    where: { slug: campusSlug, isPublished: true, universityId: university.id },
    select: {
      id: true,
      slug: true,
      name: true,
      kind: true,
      description: true,
      city: true,
      isPrimary: true,
      profileStatus: true,
    },
  })
  if (!campus) return null

  const campusSections = await db.universityHomepageSection.findMany({
    where: { universityId: university.id, campusId: campus.id, isEnabled: true },
    orderBy: { displayOrder: 'asc' },
    select: { sectionKey: true, title: true, displayOrder: true },
  })

  return {
    ...campus,
    university,
    // A campus that has not been configured inherits the university's layout.
    enabledSections: campusSections.length > 0 ? campusSections : university.enabledSections,
  }
}

/** Published campus paths for static generation and the sitemap. */
export async function listPublishedCampusPaths(): Promise<
  { universitySlug: string; campusSlug: string }[]
> {
  const campuses = await db.campus.findMany({
    where: { isPublished: true, university: { isPublished: true } },
    select: { slug: true, university: { select: { slug: true } } },
  })

  return campuses.map((campus) => ({
    universitySlug: campus.university.slug,
    campusSlug: campus.slug,
  }))
}
