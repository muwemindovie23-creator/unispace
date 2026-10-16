'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { recordAudit } from '@/lib/audit'
import { assertSameOrigin } from '@/lib/auth/session'
import { db } from '@/lib/db'
import {
  checkbox,
  optionalDate,
  optionalId,
  optionalText,
  plainText,
  requiredEmail,
} from '@/lib/form-fields'
import { rateLimit } from '@/lib/rate-limit'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, PERMISSIONS } from '@/modules/admin/rbac'

export interface ActionState {
  error?: string
  success?: string
}

const enquirySchema = z.object({
  organisation: plainText(2, 160, 'Organisation name'),
  contactName: plainText(2, 120, 'Your name'),
  contactEmail: requiredEmail,
  contactPhone: optionalText(40),
  objective: plainText(10, 1500, 'Campaign objective'),
  universityId: optionalId,
  campusHint: optionalText(160),
  placementId: optionalId,
  preferredStart: optionalDate,
  preferredEnd: optionalDate,
  budgetRange: optionalText(80),
  notes: optionalText(1500),
})

/** Public, unauthenticated. Collects only what is needed to reply. */
export async function submitAdvertisingEnquiryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSameOrigin()

  const limit = await rateLimit('advertising-enquiry', 5, 60 * 60 * 1000)
  if (!limit.allowed) {
    return { error: 'Too many enquiries from this connection. Please try again in an hour.' }
  }

  const parsed = enquirySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const input = parsed.data

  if (input.preferredStart && input.preferredEnd && input.preferredEnd < input.preferredStart) {
    return { error: 'The end date cannot be before the start date.' }
  }

  // Validate the references rather than storing whatever was posted.
  if (input.universityId) {
    const university = await db.university.findFirst({
      where: { id: input.universityId, isPublished: true },
      select: { id: true },
    })
    if (!university) return { error: 'Choose a university from the list.' }
  }

  if (input.placementId) {
    const placement = await db.advertisingPlacement.findFirst({
      where: { id: input.placementId, isAvailable: true },
      select: { id: true },
    })
    if (!placement) return { error: 'That placement is not currently available.' }
  }

  await db.advertisingEnquiry.create({ data: { ...input, status: 'NEW' } })

  await recordAudit({
    actorEmail: 'public:advertising',
    action: 'advertising.enquiry_received',
    targetType: 'AdvertisingEnquiry',
    universityId: input.universityId,
    // Organisation only — the named contact's details stay out of the log.
    metadata: { organisation: input.organisation },
  })

  revalidatePath('/admin/advertising')

  return {
    success:
      'Thank you — your enquiry has reached our advertising team. We will reply to the address you gave. Submitting this does not create a booking.',
  }
}

const statusSchema = z.object({
  enquiryId: z.string().trim().min(1),
  status: z.enum(['NEW', 'IN_REVIEW', 'CONTACTED', 'APPROVED', 'DECLINED', 'CLOSED']),
  internalNote: optionalText(1500),
})

export async function updateEnquiryStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.ADVERTISING_ENQUIRY_MANAGE)

  const parsed = statusSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const { enquiryId, status, internalNote } = parsed.data

  const existing = await db.advertisingEnquiry.findUnique({
    where: { id: enquiryId },
    select: { status: true, organisation: true },
  })
  if (!existing) return { error: 'That enquiry no longer exists.' }

  await db.advertisingEnquiry.update({
    where: { id: enquiryId },
    data: {
      status,
      internalNote,
      handledAt: status === 'NEW' ? null : new Date(),
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'advertising.enquiry_status_changed',
    targetType: 'AdvertisingEnquiry',
    targetId: enquiryId,
    metadata: { organisation: existing.organisation, from: existing.status, to: status },
  })

  revalidatePath('/admin/advertising')
  return { success: 'Enquiry updated.' }
}

const placementSchema = z.object({
  placementId: z.string().trim().min(1),
  isAvailable: checkbox,
})

/** Controls what the public Advertise page offers. Nothing is on sale by default. */
export async function setPlacementAvailabilityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.ADVERTISING_PLACEMENT_MANAGE)

  const parsed = placementSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: 'Check the form and try again.' }

  const { placementId, isAvailable } = parsed.data

  const placement = await db.advertisingPlacement.findUnique({
    where: { id: placementId },
    select: { name: true },
  })
  if (!placement) return { error: 'That placement no longer exists.' }

  await db.advertisingPlacement.update({
    where: { id: placementId },
    data: { isAvailable },
  })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: isAvailable ? 'advertising.placement_enabled' : 'advertising.placement_disabled',
    targetType: 'AdvertisingPlacement',
    targetId: placementId,
    metadata: { name: placement.name },
  })

  revalidatePath('/admin/advertising')
  revalidatePath('/advertise')
  return { success: `${placement.name} is now ${isAvailable ? 'available' : 'unavailable'}.` }
}
