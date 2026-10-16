import 'server-only'

import { db } from '@/lib/db'

/**
 * Public-facing business queries.
 *
 * Everything here selects an explicit field list. `BusinessApplication` holds
 * the applicant's personal contact details and is never joined into a public
 * shape — only the resulting listing's *published* contact details are shown.
 */

export interface BusinessCard {
  id: string
  slug: string
  name: string
  description: string
  priceRange: string | null
  categoryLabel: string | null
  categorySlug: string | null
  campusName: string | null
  locationNote: string | null
  verificationStatus: 'PENDING' | 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' | 'EXPIRED'
  lastVerifiedAt: Date | null
  isSponsored: boolean
  hasLocation: boolean
}

const CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  priceRange: true,
  locationNote: true,
  verificationStatus: true,
  lastVerifiedAt: true,
  isSponsored: true,
  latitude: true,
  longitude: true,
  mapEmbedUrl: true,
  showOnMap: true,
  category: { select: { label: true, slug: true } },
  campus: { select: { name: true } },
} as const

type CardRow = {
  id: string
  slug: string
  name: string
  description: string
  priceRange: string | null
  locationNote: string | null
  verificationStatus: BusinessCard['verificationStatus']
  lastVerifiedAt: Date | null
  isSponsored: boolean
  latitude: number | null
  longitude: number | null
  mapEmbedUrl: string | null
  showOnMap: boolean
  category: { label: string; slug: string } | null
  campus: { name: string } | null
}

function toCard(row: CardRow): BusinessCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceRange: row.priceRange,
    categoryLabel: row.category?.label ?? null,
    categorySlug: row.category?.slug ?? null,
    campusName: row.campus?.name ?? null,
    locationNote: row.locationNote,
    verificationStatus: row.verificationStatus,
    lastVerifiedAt: row.lastVerifiedAt,
    isSponsored: row.isSponsored,
    hasLocation:
      row.showOnMap &&
      (row.mapEmbedUrl !== null || (row.latitude !== null && row.longitude !== null)),
  }
}

export interface BusinessFilters {
  categorySlug?: string | null
  campusSlug?: string | null
  query?: string | null
}

/**
 * Published businesses for a university.
 *
 * Sponsored listings sort first but are always labelled in the UI, and
 * sponsorship never changes a verification status — those are separate fields
 * maintained by separate workflows.
 */
export async function listPublishedBusinesses(
  universitySlug: string,
  filters: BusinessFilters = {},
): Promise<BusinessCard[]> {
  const query = filters.query?.trim()

  const rows = await db.campusBusiness.findMany({
    where: {
      status: 'PUBLISHED',
      university: { slug: universitySlug, isPublished: true },
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters.campusSlug ? { campus: { slug: filters.campusSlug } } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              { description: { contains: query, mode: 'insensitive' as const } },
              { services: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ isSponsored: 'desc' }, { verificationStatus: 'asc' }, { name: 'asc' }],
    select: CARD_SELECT,
  })

  return rows.map(toCard)
}

export interface BusinessDetail extends BusinessCard {
  services: string | null
  publicPhone: string | null
  publicEmail: string | null
  openingHours: unknown
  socialLinks: unknown
  photos: unknown
  latitude: number | null
  longitude: number | null
  mapEmbedUrl: string | null
  showOnMap: boolean
  verificationExpiresAt: Date | null
  /** What the most recent verification actually checked. */
  lastVerificationChecks: string | null
  universityName: string
  universityAcronym: string
  universitySlug: string
}

export async function getPublishedBusiness(
  universitySlug: string,
  businessSlug: string,
): Promise<BusinessDetail | null> {
  const row = await db.campusBusiness.findFirst({
    where: {
      slug: businessSlug,
      status: 'PUBLISHED',
      university: { slug: universitySlug, isPublished: true },
    },
    select: {
      ...CARD_SELECT,
      services: true,
      publicPhone: true,
      publicEmail: true,
      openingHours: true,
      socialLinks: true,
      photos: true,
      verificationExpiresAt: true,
      university: { select: { name: true, acronym: true, slug: true } },
      verifications: {
        orderBy: { decidedAt: 'desc' },
        take: 1,
        select: { checksPerformed: true, toStatus: true },
      },
    },
  })

  if (!row) return null

  const latest = row.verifications[0]

  return {
    ...toCard(row),
    services: row.services,
    publicPhone: row.publicPhone,
    publicEmail: row.publicEmail,
    openingHours: row.openingHours,
    socialLinks: row.socialLinks,
    photos: row.photos,
    latitude: row.latitude,
    longitude: row.longitude,
    mapEmbedUrl: row.mapEmbedUrl,
    showOnMap: row.showOnMap,
    verificationExpiresAt: row.verificationExpiresAt,
    lastVerificationChecks:
      latest && latest.toStatus === 'VERIFIED' ? latest.checksPerformed : null,
    universityName: row.university.name,
    universityAcronym: row.university.acronym,
    universitySlug: row.university.slug,
  }
}

/** Businesses with a usable location, for the campus map view. */
export async function listMappableBusinesses(
  universitySlug: string,
  campusSlug?: string | null,
): Promise<BusinessCard[]> {
  const rows = await db.campusBusiness.findMany({
    where: {
      status: 'PUBLISHED',
      showOnMap: true,
      university: { slug: universitySlug, isPublished: true },
      ...(campusSlug ? { campus: { slug: campusSlug } } : {}),
      OR: [
        { mapEmbedUrl: { not: null } },
        { AND: [{ latitude: { not: null } }, { longitude: { not: null } }] },
      ],
    },
    orderBy: [{ isSponsored: 'desc' }, { name: 'asc' }],
    select: CARD_SELECT,
  })

  return rows.map(toCard)
}

/** Categories that actually have published listings, for the filter bar. */
export async function listBusinessCategories(universitySlug: string) {
  const rows = await db.taxonomyTerm.findMany({
    where: {
      kind: 'BUSINESS',
      isActive: true,
      businesses: {
        some: { status: 'PUBLISHED', university: { slug: universitySlug } },
      },
    },
    orderBy: { displayOrder: 'asc' },
    select: {
      slug: true,
      label: true,
      _count: {
        select: {
          businesses: { where: { status: 'PUBLISHED', university: { slug: universitySlug } } },
        },
      },
    },
  })

  return rows.map((row) => ({ slug: row.slug, label: row.label, count: row._count.businesses }))
}

export async function listPublishedBusinessPaths() {
  const rows = await db.campusBusiness.findMany({
    where: { status: 'PUBLISHED', university: { isPublished: true } },
    select: { slug: true, university: { select: { slug: true } } },
  })

  return rows.map((row) => ({ universitySlug: row.university.slug, businessSlug: row.slug }))
}
