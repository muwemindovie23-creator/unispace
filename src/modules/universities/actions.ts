'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { z } from 'zod'

import { recordAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import { DEFAULT_THEME } from '@/lib/theme/tokens'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, PERMISSIONS } from '@/modules/admin/rbac'
import { campusSchema, universitySchema } from '@/modules/universities/schemas'
import { DEFAULT_SECTION_ORDER, isHomepageSectionKey } from '@/modules/universities/sections'

export interface ActionState {
  error?: string
  success?: string
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Check the form and try again.'
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  )
}

/** Public pages that change when a university's own details change. */
function revalidateUniversity(slug: string) {
  revalidatePath('/')
  revalidatePath('/universities/official-websites')
  revalidatePath(`/universities/${slug}`)
  revalidatePath('/sitemap.xml')
}

// ---------------------------------------------------------------------------
// Universities
// ---------------------------------------------------------------------------

export async function createUniversityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.UNIVERSITY_CREATE)

  const parsed = universitySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const input = parsed.data
  let universityId: string

  try {
    const university = await db.university.create({
      data: {
        ...input,
        country: 'Malawi',
        // A new university starts with the UniSpace house theme in both
        // variants, so the theme editor has something to work from and the
        // public pages never fall back to an unstyled page.
        themes: {
          create: (['PUBLISHED', 'DRAFT'] as const).map((variant) => ({
            variant,
            ...DEFAULT_THEME,
            decorativePatternUrl: undefined,
            sourceNote:
              'UniSpace default palette. Replace with the confirmed brand guideline.',
          })),
        },
        homepageSections: {
          create: DEFAULT_SECTION_ORDER.map((sectionKey, displayOrder) => ({
            sectionKey,
            isEnabled: true,
            displayOrder,
          })),
        },
      },
      select: { id: true, slug: true, acronym: true },
    })
    universityId = university.id

    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'university.created',
      targetType: 'University',
      targetId: university.id,
      universityId: university.id,
      metadata: { acronym: university.acronym, slug: university.slug, published: input.isPublished },
    })

    revalidateUniversity(university.slug)
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `The URL slug “${input.slug}” is already used by another university.` }
    }
    throw error
  }

  redirect(`/admin/universities/${universityId}`)
}

export async function updateUniversityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const universityId = String(formData.get('universityId') ?? '')
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.UNIVERSITY_UPDATE, { universityId })

  const parsed = universitySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const input = parsed.data

  const existing = await db.university.findUnique({
    where: { id: universityId },
    select: { slug: true, isPublished: true },
  })
  if (!existing) return { error: 'That university no longer exists.' }

  // Publishing a university is a separate, higher permission from editing it.
  if (input.isPublished !== existing.isPublished) {
    assertCan(actor, PERMISSIONS.UNIVERSITY_PUBLISH, { universityId })
  }

  try {
    await db.university.update({ where: { id: universityId }, data: input })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `The URL slug “${input.slug}” is already used by another university.` }
    }
    throw error
  }

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action:
      input.isPublished === existing.isPublished
        ? 'university.updated'
        : input.isPublished
          ? 'university.published'
          : 'university.unpublished',
    targetType: 'University',
    targetId: universityId,
    universityId,
    metadata: { acronym: input.acronym, slugFrom: existing.slug, slugTo: input.slug },
  })

  revalidateUniversity(existing.slug)
  if (existing.slug !== input.slug) revalidateUniversity(input.slug)
  revalidatePath(`/admin/universities/${universityId}`)

  return { success: 'University saved.' }
}

// ---------------------------------------------------------------------------
// Campuses
// ---------------------------------------------------------------------------

/**
 * Only one campus per university may be the main one, so setting a new primary
 * clears the previous flag in the same transaction.
 */
async function clearOtherPrimaries(universityId: string, keepCampusId?: string) {
  await db.campus.updateMany({
    where: { universityId, isPrimary: true, ...(keepCampusId ? { id: { not: keepCampusId } } : {}) },
    data: { isPrimary: false },
  })
}

export async function createCampusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const universityId = String(formData.get('universityId') ?? '')
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.CAMPUS_CREATE, { universityId })

  const parsed = campusSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const input = parsed.data

  const university = await db.university.findUnique({
    where: { id: universityId },
    select: { slug: true, acronym: true },
  })
  if (!university) return { error: 'That university no longer exists.' }

  try {
    const campus = await db.campus.create({
      data: { ...input, universityId },
      select: { id: true, name: true },
    })

    if (input.isPrimary) await clearOtherPrimaries(universityId, campus.id)

    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'campus.created',
      targetType: 'Campus',
      targetId: campus.id,
      universityId,
      campusId: campus.id,
      metadata: { name: campus.name, slug: input.slug, published: input.isPublished },
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `The URL slug “${input.slug}” is already used by another campus here.` }
    }
    throw error
  }

  revalidateUniversity(university.slug)
  revalidatePath(`/admin/universities/${universityId}/campuses`)

  return { success: `${input.name} added.` }
}

export async function updateCampusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campusId = String(formData.get('campusId') ?? '')
  const actor = await requireActor()

  // The university is resolved from the database, never from the form, so a
  // forged universityId cannot move a campus into someone else's scope.
  const existing = await db.campus.findUnique({
    where: { id: campusId },
    select: {
      universityId: true,
      slug: true,
      name: true,
      isPublished: true,
      university: { select: { slug: true } },
    },
  })
  if (!existing) return { error: 'That campus no longer exists.' }

  assertCan(actor, PERMISSIONS.CAMPUS_UPDATE, {
    universityId: existing.universityId,
    campusId,
  })

  const parsed = campusSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const input = parsed.data

  try {
    await db.campus.update({ where: { id: campusId }, data: input })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `The URL slug “${input.slug}” is already used by another campus here.` }
    }
    throw error
  }

  if (input.isPrimary) await clearOtherPrimaries(existing.universityId, campusId)

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action:
      input.isPublished === existing.isPublished
        ? 'campus.updated'
        : input.isPublished
          ? 'campus.published'
          : 'campus.unpublished',
    targetType: 'Campus',
    targetId: campusId,
    universityId: existing.universityId,
    campusId,
    metadata: { name: input.name, slugFrom: existing.slug, slugTo: input.slug },
  })

  revalidateUniversity(existing.university.slug)
  revalidatePath(`/universities/${existing.university.slug}/campus/${existing.slug}`)
  revalidatePath(`/admin/universities/${existing.universityId}/campuses`)

  return { success: 'Campus saved.' }
}

/**
 * Deletion is refused while anything still points at the campus. Cascading
 * would silently revoke administrator assignments and detach content, so the
 * administrator is told what to deal with first.
 */
export async function deleteCampusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const campusId = String(formData.get('campusId') ?? '')
  const actor = await requireActor()

  const campus = await db.campus.findUnique({
    where: { id: campusId },
    select: {
      universityId: true,
      name: true,
      university: { select: { slug: true } },
      _count: {
        select: {
          assignments: true,
          events: true,
          tourStops: true,
          tips: true,
          polls: true,
          businesses: true,
          srcRepresentatives: true,
          submissions: true,
        },
      },
    },
  })
  if (!campus) return { error: 'That campus no longer exists.' }

  assertCan(actor, PERMISSIONS.CAMPUS_DELETE, {
    universityId: campus.universityId,
    campusId,
  })

  const blockers = Object.entries(campus._count).filter(([, count]) => count > 0)
  if (blockers.length > 0) {
    const detail = blockers.map(([name, count]) => `${count} ${name}`).join(', ')
    return {
      error: `Cannot delete ${campus.name}: ${detail} still reference it. Reassign or remove those first, or unpublish the campus instead.`,
    }
  }

  await db.campus.delete({ where: { id: campusId } })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'campus.deleted',
    targetType: 'Campus',
    targetId: campusId,
    universityId: campus.universityId,
    metadata: { name: campus.name },
  })

  revalidateUniversity(campus.university.slug)
  revalidatePath(`/admin/universities/${campus.universityId}/campuses`)

  return { success: `${campus.name} deleted.` }
}

// ---------------------------------------------------------------------------
// Homepage sections
// ---------------------------------------------------------------------------

/**
 * Saves which sections appear on a university or campus homepage, and in what
 * order. `campusId` null configures the university-wide homepage.
 */
export async function saveHomepageSectionsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const universityId = String(formData.get('universityId') ?? '')
  const rawCampusId = String(formData.get('campusId') ?? '')
  const campusId = rawCampusId.length > 0 ? rawCampusId : null

  const actor = await requireActor()

  let campusSlug: string | null = null
  if (campusId) {
    const campus = await db.campus.findUnique({
      where: { id: campusId },
      select: { universityId: true, slug: true },
    })
    if (!campus || campus.universityId !== universityId) {
      return { error: 'That campus does not belong to this university.' }
    }
    campusSlug = campus.slug
  }

  assertCan(actor, PERMISSIONS.UNIVERSITY_HOMEPAGE_MANAGE, { universityId, campusId })

  const university = await db.university.findUnique({
    where: { id: universityId },
    select: { slug: true, acronym: true },
  })
  if (!university) return { error: 'That university no longer exists.' }

  // Order comes from the hidden ordered list; enabled comes from the checkboxes.
  // Unknown keys are discarded rather than stored.
  const orderedKeys = formData
    .getAll('sectionKey')
    .map(String)
    .filter(isHomepageSectionKey)
  const enabledKeys = new Set(
    formData.getAll('enabled').map(String).filter(isHomepageSectionKey),
  )

  if (orderedKeys.length === 0) return { error: 'No valid sections were submitted.' }

  // Read the existing rows once, then write them all in a single batched
  // transaction. An interactive transaction that queried per section made over
  // a dozen sequential round trips and exceeded Prisma's 5s transaction
  // timeout against a pooled remote database.
  const existingRows = await db.universityHomepageSection.findMany({
    where: { universityId, campusId },
    select: { id: true, sectionKey: true },
  })
  const existingIdByKey = new Map(existingRows.map((row) => [row.sectionKey, row.id]))

  await db.$transaction(
    orderedKeys.map((sectionKey, displayOrder) => {
      const isEnabled = enabledKeys.has(sectionKey)
      const existingId = existingIdByKey.get(sectionKey)

      // Update by primary key, which works whether or not campusId is NULL —
      // Prisma cannot address a compound unique key that contains a NULL.
      return existingId
        ? db.universityHomepageSection.update({
            where: { id: existingId },
            data: { isEnabled, displayOrder },
          })
        : db.universityHomepageSection.create({
            data: { universityId, campusId, sectionKey, isEnabled, displayOrder },
          })
    }),
  )

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'university.homepage_sections_updated',
    targetType: 'UniversityHomepageSection',
    targetId: campusId ?? universityId,
    universityId,
    campusId,
    metadata: {
      acronym: university.acronym,
      scope: campusId ? 'campus' : 'university',
      enabled: orderedKeys.filter((key) => enabledKeys.has(key)),
    },
  })

  revalidatePath(`/universities/${university.slug}`)
  if (campusSlug) revalidatePath(`/universities/${university.slug}/campus/${campusSlug}`)

  return { success: 'Homepage sections saved.' }
}
