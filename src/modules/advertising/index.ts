import 'server-only'

import { db } from '@/lib/db'

/**
 * Advertising enquiries and placements.
 *
 * Two rules this module exists to keep:
 *  - Paid placements are always labelled. `CampusBusiness.isSponsored` drives a
 *    visible "Sponsored" badge; nothing is ever quietly promoted.
 *  - Paying never changes a verification decision or a poll result. Those live
 *    in different tables, written by different actions, under different
 *    permissions.
 */

export interface PublicPlacement {
  key: string
  name: string
  description: string | null
  universityAcronym: string | null
}

/**
 * Placements a Super Admin has marked available. Returns an empty list until
 * someone does — we do not advertise inventory that does not exist.
 */
export async function listAvailablePlacements(): Promise<PublicPlacement[]> {
  const rows = await db.advertisingPlacement.findMany({
    where: { isAvailable: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      key: true,
      name: true,
      description: true,
      university: { select: { acronym: true } },
    },
  })

  return rows.map((row) => ({
    key: row.key,
    name: row.name,
    description: row.description,
    universityAcronym: row.university?.acronym ?? null,
  }))
}

/** Every placement, for the dashboard. */
export async function listAllPlacements() {
  return db.advertisingPlacement.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      isAvailable: true,
      university: { select: { acronym: true } },
      _count: { select: { enquiries: true } },
    },
  })
}

export interface EnquiryRow {
  id: string
  organisation: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  objective: string
  budgetRange: string | null
  notes: string | null
  campusHint: string | null
  preferredStart: Date | null
  preferredEnd: Date | null
  status: 'NEW' | 'IN_REVIEW' | 'CONTACTED' | 'APPROVED' | 'DECLINED' | 'CLOSED'
  internalNote: string | null
  createdAt: Date
  universityAcronym: string | null
  placementName: string | null
}

/**
 * Advertising enquiries contain a named person's contact details, so this is
 * only ever called behind an `advertising.enquiry.read` permission check.
 */
export async function listEnquiries(status?: EnquiryRow['status']): Promise<EnquiryRow[]> {
  const rows = await db.advertisingEnquiry.findMany({
    where: status ? { status } : {},
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    select: {
      id: true,
      organisation: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      objective: true,
      budgetRange: true,
      notes: true,
      campusHint: true,
      preferredStart: true,
      preferredEnd: true,
      status: true,
      internalNote: true,
      createdAt: true,
      university: { select: { acronym: true } },
      placement: { select: { name: true } },
    },
  })

  return rows.map((row) => ({
    ...row,
    universityAcronym: row.university?.acronym ?? null,
    placementName: row.placement?.name ?? null,
  }))
}

export async function countEnquiriesByStatus() {
  const grouped = await db.advertisingEnquiry.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  return Object.fromEntries(grouped.map((row) => [row.status, row._count._all])) as Record<
    string,
    number
  >
}
