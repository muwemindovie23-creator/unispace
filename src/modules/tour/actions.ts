'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { recordAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import {
  optionalCoordinate,
  optionalId,
  optionalInt,
  optionalText,
  optionalUrl,
  plainText,
  slugField,
} from '@/lib/form-fields'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, PERMISSIONS } from '@/modules/admin/rbac'
import { mapEmbedField } from '@/modules/businesses/schemas'

export interface ActionState {
  error?: string
  success?: string
}

const stopSchema = z.object({
  title: plainText(2, 160, 'A name for the place'),
  slug: slugField,
  description: plainText(10, 2000, 'A description'),
  practicalNote: optionalText(600),
  photoUrl: optionalUrl,
  mapEmbedUrl: mapEmbedField,
  latitude: optionalCoordinate(90, 'Latitude'),
  longitude: optionalCoordinate(180, 'Longitude'),
  placeQuery: optionalText(200),
  campusId: optionalId,
  displayOrder: optionalInt(0, 0, 9999),
  status: z.enum(['DRAFT', 'NEEDS_REVIEW', 'PUBLISHED', 'ARCHIVED']),
  evidenceLevel: z.enum(['UNVERIFIED', 'STUDENT_REPORTED', 'STAFF_CHECKED', 'OFFICIAL_SOURCE']),
  sourceNote: optionalText(600),
})

export async function saveTourStopAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const stopId = String(formData.get('stopId') ?? '')
  const universityIdInput = String(formData.get('universityId') ?? '')
  const actor = await requireActor()

  const parsed = stopSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }
  const input = parsed.data

  const existing = stopId
    ? await db.campusTourStop.findUnique({
        where: { id: stopId },
        select: {
          id: true,
          universityId: true,
          status: true,
          university: { select: { slug: true } },
        },
      })
    : null
  if (stopId && !existing) return { error: 'That tour stop no longer exists.' }

  const universityId = existing?.universityId ?? universityIdInput
  if (!universityId) return { error: 'No university was supplied.' }

  if (input.campusId) {
    const campus = await db.campus.findFirst({
      where: { id: input.campusId, universityId },
      select: { id: true },
    })
    if (!campus) return { error: 'That campus does not belong to this university.' }
  }

  assertCan(actor, PERMISSIONS.TOUR_WRITE, { universityId, campusId: input.campusId })

  const willBePublished = input.status === 'PUBLISHED'
  if (willBePublished !== (existing?.status === 'PUBLISHED')) {
    assertCan(actor, PERMISSIONS.TOUR_PUBLISH, { universityId, campusId: input.campusId })
  }

  // A stop with nothing to show on a map is allowed, but it is worth telling
  // the administrator rather than silently rendering an empty panel.
  const hasMapSource =
    input.mapEmbedUrl !== null ||
    (input.latitude !== null && input.longitude !== null) ||
    (input.placeQuery !== null && input.placeQuery.length > 2)

  if (willBePublished && !hasMapSource) {
    return {
      error:
        'A published tour stop needs a map: paste a Google Maps embed, or give coordinates, or a place name.',
    }
  }

  const data = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    practicalNote: input.practicalNote,
    photoUrl: input.photoUrl,
    mapEmbedUrl: input.mapEmbedUrl,
    latitude: input.latitude,
    longitude: input.longitude,
    placeQuery: input.placeQuery,
    campusId: input.campusId,
    displayOrder: input.displayOrder,
    status: input.status,
    evidenceLevel: input.evidenceLevel,
    sourceNote: input.sourceNote,
    publishedAt: willBePublished ? (existing?.status === 'PUBLISHED' ? undefined : new Date()) : null,
  }

  let universitySlug = existing?.university.slug

  try {
    if (existing) {
      await db.campusTourStop.update({ where: { id: existing.id }, data })
    } else {
      const created = await db.campusTourStop.create({
        data: { ...data, universityId },
        select: { university: { select: { slug: true } } },
      })
      universitySlug = created.university.slug
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: `The URL slug “${input.slug}” is already used by another stop here.` }
    }
    throw error
  }

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: existing ? 'tour.stop_updated' : 'tour.stop_created',
    targetType: 'CampusTourStop',
    targetId: existing?.id,
    universityId,
    campusId: input.campusId,
    metadata: { title: input.title, status: input.status },
  })

  if (universitySlug) revalidatePath(`/universities/${universitySlug}/tour`)
  revalidatePath(`/admin/universities/${universityId}/tour`)

  return { success: existing ? 'Tour stop saved.' : `${input.title} added to the tour.` }
}

export async function deleteTourStopAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const stopId = String(formData.get('stopId') ?? '')
  const actor = await requireActor()

  const stop = await db.campusTourStop.findUnique({
    where: { id: stopId },
    select: {
      id: true,
      title: true,
      universityId: true,
      campusId: true,
      university: { select: { slug: true } },
    },
  })
  if (!stop) return { error: 'That tour stop no longer exists.' }

  assertCan(actor, PERMISSIONS.TOUR_WRITE, {
    universityId: stop.universityId,
    campusId: stop.campusId,
  })

  await db.campusTourStop.delete({ where: { id: stop.id } })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'tour.stop_deleted',
    targetType: 'CampusTourStop',
    targetId: stop.id,
    universityId: stop.universityId,
    metadata: { title: stop.title },
  })

  revalidatePath(`/universities/${stop.university.slug}/tour`)
  revalidatePath(`/admin/universities/${stop.universityId}/tour`)

  return { success: `${stop.title} removed from the tour.` }
}
