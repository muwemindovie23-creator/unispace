import 'server-only'

import { db } from '@/lib/db'

/**
 * The virtual campus tour: an ordered walk through the places on campus that
 * students actually use, each with a map.
 *
 * Replaces the societies directory from the original plan.
 */

export interface TourStop {
  id: string
  slug: string
  title: string
  description: string
  practicalNote: string | null
  photoUrl: string | null
  mapEmbedUrl: string | null
  latitude: number | null
  longitude: number | null
  placeQuery: string | null
  campusName: string | null
  campusSlug: string | null
  evidenceLevel: 'UNVERIFIED' | 'STUDENT_REPORTED' | 'STAFF_CHECKED' | 'OFFICIAL_SOURCE'
  lastCheckedAt: Date | null
}

const STOP_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  practicalNote: true,
  photoUrl: true,
  mapEmbedUrl: true,
  latitude: true,
  longitude: true,
  placeQuery: true,
  evidenceLevel: true,
  lastCheckedAt: true,
  campus: { select: { name: true, slug: true } },
} as const

/**
 * Published stops for a university, optionally narrowed to one campus.
 *
 * A campus filter includes university-wide stops too (campusId null), because
 * those apply everywhere.
 */
export async function listPublishedTourStops(
  universitySlug: string,
  campusSlug?: string | null,
): Promise<TourStop[]> {
  const rows = await db.campusTourStop.findMany({
    where: {
      status: 'PUBLISHED',
      university: { slug: universitySlug, isPublished: true },
      ...(campusSlug ? { OR: [{ campus: { slug: campusSlug } }, { campusId: null }] } : {}),
    },
    orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    select: STOP_SELECT,
  })

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    practicalNote: row.practicalNote,
    photoUrl: row.photoUrl,
    mapEmbedUrl: row.mapEmbedUrl,
    latitude: row.latitude,
    longitude: row.longitude,
    placeQuery: row.placeQuery,
    campusName: row.campus?.name ?? null,
    campusSlug: row.campus?.slug ?? null,
    evidenceLevel: row.evidenceLevel,
    lastCheckedAt: row.lastCheckedAt,
  }))
}

/** Every stop for a university, including drafts, for the dashboard. */
export async function listManageableTourStops(universityId: string) {
  return db.campusTourStop.findMany({
    where: { universityId },
    orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      displayOrder: true,
      mapEmbedUrl: true,
      latitude: true,
      longitude: true,
      placeQuery: true,
      campus: { select: { id: true, name: true } },
    },
  })
}

export async function getTourStopForEdit(stopId: string) {
  return db.campusTourStop.findUnique({
    where: { id: stopId },
    select: {
      id: true,
      universityId: true,
      campusId: true,
      slug: true,
      title: true,
      description: true,
      practicalNote: true,
      photoUrl: true,
      mapEmbedUrl: true,
      latitude: true,
      longitude: true,
      placeQuery: true,
      displayOrder: true,
      status: true,
      evidenceLevel: true,
      sourceNote: true,
      university: { select: { slug: true, acronym: true } },
    },
  })
}
