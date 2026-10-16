'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { recordAudit } from '@/lib/audit'
import { assertSameOrigin } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS } from '@/modules/admin/rbac'
import {
  businessApplicationSchema,
  businessReportSchema,
  businessSchema,
  verificationDecisionSchema,
} from '@/modules/businesses/schemas'

export interface ActionState {
  error?: string
  success?: string
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Check the form and try again.'
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

// ---------------------------------------------------------------------------
// Public: apply to be listed
// ---------------------------------------------------------------------------

/**
 * A public, unauthenticated write. Applications never become listings on their
 * own — they land in a queue for a reviewer, which is the whole point of the
 * verification policy.
 */
export async function submitBusinessApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Server Actions carry Next's own origin protection, but this one is reachable
  // by anyone, so the check is made explicit.
  await assertSameOrigin()

  const limit = await rateLimit('business-application', 5, 60 * 60 * 1000)
  if (!limit.allowed) {
    return {
      error: 'Too many applications from this connection. Please try again in an hour.',
    }
  }

  const parsed = businessApplicationSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const input = parsed.data

  const university = await db.university.findFirst({
    where: { id: input.universityId, isPublished: true },
    select: { id: true, acronym: true },
  })
  if (!university) return { error: 'Choose a university from the list.' }

  // A campus must belong to the chosen university; never trust the pairing.
  if (input.campusId) {
    const campus = await db.campus.findFirst({
      where: { id: input.campusId, universityId: university.id, isPublished: true },
      select: { id: true },
    })
    if (!campus) return { error: 'That campus does not belong to the university you chose.' }
  }

  await db.businessApplication.create({
    data: {
      universityId: university.id,
      campusId: input.campusId,
      businessName: input.businessName,
      categoryHint: input.categoryHint,
      description: input.description,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      locationNote: input.locationNote,
      website: input.website,
      evidenceNote: input.evidenceNote,
      status: 'PENDING',
    },
  })

  // Deliberately no actor and no personal data: this is a public submission.
  await recordAudit({
    actorEmail: 'public:application',
    action: 'business.application_received',
    targetType: 'BusinessApplication',
    universityId: university.id,
    metadata: { acronym: university.acronym },
  })

  return {
    success:
      'Thank you — your application has been received. We review each one by hand, so this is not automatic, and being listed is not guaranteed.',
  }
}

// ---------------------------------------------------------------------------
// Public: report a listing
// ---------------------------------------------------------------------------

/** Reports enter the moderation queue. Nothing is removed automatically. */
export async function reportBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSameOrigin()

  const limit = await rateLimit('business-report', 10, 60 * 60 * 1000)
  if (!limit.allowed) {
    return { error: 'Too many reports from this connection. Please try again later.' }
  }

  const parsed = businessReportSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const { businessId, reason, details, reporterEmail } = parsed.data

  const business = await db.campusBusiness.findFirst({
    where: { id: businessId, status: 'PUBLISHED' },
    select: { id: true, name: true, universityId: true },
  })
  if (!business) return { error: 'That listing could not be found.' }

  await db.moderationReport.create({
    data: {
      targetType: 'business',
      targetId: business.id,
      reason,
      details,
      reporterEmail,
      status: 'OPEN',
    },
  })

  return {
    success:
      'Thank you — this has gone to our moderation queue for a person to look at. The listing stays up while we check.',
  }
}

// ---------------------------------------------------------------------------
// Admin: listings
// ---------------------------------------------------------------------------

/** Resolves a business to its real scope; never trusts ids from the client. */
async function resolveBusinessScope(businessId: string) {
  return db.campusBusiness.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      slug: true,
      name: true,
      universityId: true,
      campusId: true,
      status: true,
      university: { select: { slug: true } },
    },
  })
}

export async function saveBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const businessId = String(formData.get('businessId') ?? '')
  const universityIdInput = String(formData.get('universityId') ?? '')
  const actor = await requireActor()

  const parsed = businessSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }
  const input = parsed.data

  const existing = businessId ? await resolveBusinessScope(businessId) : null
  if (businessId && !existing) return { error: 'That listing no longer exists.' }

  const universityId = existing?.universityId ?? universityIdInput
  if (!universityId) return { error: 'No university was supplied.' }

  // The campus must belong to this university, resolved from the database.
  if (input.campusId) {
    const campus = await db.campus.findFirst({
      where: { id: input.campusId, universityId },
      select: { id: true },
    })
    if (!campus) return { error: 'That campus does not belong to this university.' }
  }

  assertCan(actor, PERMISSIONS.BUSINESS_WRITE, { universityId, campusId: input.campusId })

  // Publishing is a higher permission than editing a draft.
  const willBePublished = input.status === 'PUBLISHED'
  const wasPublished = existing?.status === 'PUBLISHED'
  if (willBePublished !== wasPublished) {
    assertCan(actor, PERMISSIONS.BUSINESS_PUBLISH, { universityId, campusId: input.campusId })
  }

  const data = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    categoryId: input.categoryId,
    campusId: input.campusId,
    locationNote: input.locationNote,
    latitude: input.latitude,
    longitude: input.longitude,
    mapEmbedUrl: input.mapEmbedUrl,
    showOnMap: input.showOnMap,
    publicPhone: input.publicPhone,
    publicEmail: input.publicEmail,
    priceRange: input.priceRange,
    services: input.services,
    status: input.status,
    isSponsored: input.isSponsored,
    publishedAt: willBePublished ? (existing?.status === 'PUBLISHED' ? undefined : new Date()) : null,
  }

  let slugForPath = input.slug
  let universitySlug = existing?.university.slug

  try {
    if (existing) {
      await db.campusBusiness.update({ where: { id: existing.id }, data })
    } else {
      const created = await db.campusBusiness.create({
        data: { ...data, universityId },
        select: { slug: true, university: { select: { slug: true } } },
      })
      slugForPath = created.slug
      universitySlug = created.university.slug
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: `The URL slug “${input.slug}” is already used by another listing here.` }
    }
    throw error
  }

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: existing ? 'business.updated' : 'business.created',
    targetType: 'CampusBusiness',
    targetId: existing?.id,
    universityId,
    campusId: input.campusId,
    metadata: { name: input.name, status: input.status, sponsored: input.isSponsored },
  })

  if (universitySlug) {
    revalidatePath(`/universities/${universitySlug}/businesses`)
    revalidatePath(`/universities/${universitySlug}/businesses/${slugForPath}`)
    revalidatePath(`/universities/${universitySlug}/tour`)
  }

  return { success: existing ? 'Listing saved.' : `${input.name} created.` }
}

// ---------------------------------------------------------------------------
// Admin: verification
// ---------------------------------------------------------------------------

/**
 * Records a verification decision and, on approval, creates the public listing
 * from the application.
 *
 * `checksPerformed` is mandatory: the badge means only what was actually
 * checked, and the public page shows that text. A decision without a record of
 * what was verified would make the badge meaningless.
 */
export async function decideBusinessApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = verificationDecisionSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: firstIssue(parsed.error) }

  const { applicationId, decision, checksPerformed, note, publishNow } = parsed.data
  const actor = await requireActor()

  const application = await db.businessApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      universityId: true,
      campusId: true,
      businessName: true,
      description: true,
      locationNote: true,
      website: true,
      business: { select: { id: true } },
      university: { select: { slug: true } },
    },
  })
  if (!application) return { error: 'That application no longer exists.' }

  assertCan(actor, PERMISSIONS.BUSINESS_VERIFY, {
    universityId: application.universityId,
    campusId: application.campusId,
  })

  // Publishing straight from the queue is a convenience, not a loosening:
  // the reviewer must separately hold the publish permission in this scope.
  const shouldPublish =
    publishNow &&
    decision === 'VERIFIED' &&
    can(actor, PERMISSIONS.BUSINESS_PUBLISH, {
      universityId: application.universityId,
      campusId: application.campusId,
    })

  if (publishNow && decision === 'VERIFIED' && !shouldPublish) {
    return {
      error:
        'You can verify this application but not publish listings here. Record the decision without publishing, and ask someone with the publish permission to review the copy.',
    }
  }

  const now = new Date()
  // A badge is not forever. Verification lapses and has to be renewed.
  const expiresAt =
    decision === 'VERIFIED'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : null

  await db.$transaction(async (tx) => {
    await tx.businessApplication.update({
      where: { id: application.id },
      data: {
        status: decision,
        reviewNote: note,
        reviewedAt: now,
      },
    })

    await tx.businessVerification.create({
      data: {
        applicationId: application.id,
        businessId: application.business?.id ?? null,
        fromStatus: application.status,
        toStatus: decision,
        checksPerformed,
        note,
        reviewerId: actor.id,
        decidedAt: now,
        expiresAt,
      },
    })

    if (decision === 'VERIFIED' && !application.business) {
      // Defaults to DRAFT: verifying identity is not the same as deciding the
      // listing copy — which is the applicant's own words — is ready to
      // publish. The reviewer can opt into publishing now.
      await tx.campusBusiness.create({
        data: {
          universityId: application.universityId,
          campusId: application.campusId,
          applicationId: application.id,
          name: application.businessName,
          slug: `${application.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60)}-${application.id.slice(-5)}`,
          description: application.description,
          locationNote: application.locationNote,
          status: shouldPublish ? 'PUBLISHED' : 'DRAFT',
          publishedAt: shouldPublish ? now : null,
          verificationStatus: 'VERIFIED',
          lastVerifiedAt: now,
          verificationExpiresAt: expiresAt,
        },
      })
    } else if (application.business) {
      await tx.campusBusiness.update({
        where: { id: application.business.id },
        data: {
          verificationStatus: decision,
          lastVerifiedAt: decision === 'VERIFIED' ? now : undefined,
          verificationExpiresAt: expiresAt,
        },
      })
    }
  })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'business.verification_decided',
    targetType: 'BusinessApplication',
    targetId: application.id,
    universityId: application.universityId,
    campusId: application.campusId,
    // The decision and what was checked, never the applicant's contact details.
    metadata: { decision, businessName: application.businessName, published: shouldPublish },
  })

  revalidatePath('/admin/businesses/applications')
  revalidatePath('/admin')
  revalidatePath(`/universities/${application.university.slug}/businesses`)
  revalidatePath(`/universities/${application.university.slug}/tour`)

  if (decision !== 'VERIFIED') {
    return { success: `Recorded as ${decision.toLowerCase().replace('_', ' ')}.` }
  }

  return {
    success: shouldPublish
      ? 'Verified and published. The listing is live in the campus business directory now.'
      : 'Verified. A listing has been created as a DRAFT, so it is not public yet — open it below to review the copy and publish it.',
  }
}
