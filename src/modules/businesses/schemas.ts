import { z } from 'zod'

import {
  checkbox,
  optionalCoordinate,
  optionalEmail,
  optionalId,
  optionalText,
  optionalUrl,
  plainText,
  requiredEmail,
  slugField,
} from '@/lib/form-fields'
import { normaliseMapEmbedInput } from '@/lib/maps'

/**
 * Validation for campus business listings and public applications.
 *
 * The public application form is the one place where an untrusted stranger
 * writes to the database, so it is the strictest schema in the codebase.
 */

/**
 * A map embed is normalised through the maps allow-list. Anything that is not
 * a Google Maps embed fails here rather than being stored and silently dropped
 * at render time, so the administrator finds out immediately.
 */
export const mapEmbedField = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim())
  .transform((value, ctx) => {
    if (value.length === 0) return null
    const normalised = normaliseMapEmbedInput(value)
    if (!normalised) {
      ctx.addIssue({
        code: 'custom',
        message:
          'That is not a Google Maps embed. In Google Maps choose Share → Embed a map, then paste what it gives you.',
      })
      return null
    }
    return normalised
  })

export const businessSchema = z.object({
  name: plainText(2, 160, 'Business name'),
  slug: slugField,
  description: plainText(10, 2000, 'Description'),
  categoryId: optionalId,
  campusId: optionalId,
  locationNote: optionalText(300),
  latitude: optionalCoordinate(90, 'Latitude'),
  longitude: optionalCoordinate(180, 'Longitude'),
  mapEmbedUrl: mapEmbedField,
  showOnMap: checkbox,
  publicPhone: optionalText(40),
  publicEmail: optionalEmail,
  priceRange: optionalText(60),
  services: optionalText(600),
  status: z.enum(['DRAFT', 'NEEDS_REVIEW', 'PUBLISHED', 'ARCHIVED']),
  isSponsored: checkbox,
})

export type BusinessInput = z.infer<typeof businessSchema>

/**
 * The public "become a verified campus business" form.
 *
 * Collects only what is needed to assess and contact the applicant. No
 * coordinates are accepted here: a location is confirmed by a reviewer, not
 * asserted by the applicant.
 */
export const businessApplicationSchema = z.object({
  universityId: z
    .string()
    .optional()
    .transform((value) => (value ?? '').trim())
    .refine((value) => value.length > 0, { message: 'Choose a university.' }),
  campusId: optionalId,
  businessName: plainText(2, 160, 'Business name'),
  categoryHint: optionalText(80),
  description: plainText(20, 1500, 'Description'),
  contactName: plainText(2, 120, 'Your name'),
  contactEmail: requiredEmail,
  contactPhone: optionalText(40),
  locationNote: optionalText(300),
  website: optionalUrl,
  evidenceNote: optionalText(1000),
  /** Must be ticked: it is the applicant's confirmation of accuracy. */
  confirmAccurate: checkbox.refine((value) => value === true, {
    message: 'Please confirm the details are accurate and that you may publish them.',
  }),
})

export type BusinessApplicationInput = z.infer<typeof businessApplicationSchema>

export const verificationDecisionSchema = z.object({
  applicationId: z.string().trim().min(1),
  decision: z.enum(['VERIFIED', 'NEEDS_REVIEW', 'REJECTED']),
  /** What was actually checked. The badge means only this. */
  checksPerformed: plainText(5, 600, 'A record of what you checked'),
  note: optionalText(1000),
})

export const businessReportSchema = z.object({
  businessId: z.string().trim().min(1),
  reason: z.enum([
    'CLOSED',
    'WRONG_CONTACT',
    'WRONG_LOCATION',
    'MISLEADING',
    'NOT_A_BUSINESS',
    'OTHER',
  ]),
  details: optionalText(1000),
  reporterEmail: optionalEmail,
})

export const REPORT_REASON_LABELS: Record<string, string> = {
  CLOSED: 'This business has closed',
  WRONG_CONTACT: 'The contact details are wrong',
  WRONG_LOCATION: 'The location is wrong',
  MISLEADING: 'The listing is misleading',
  NOT_A_BUSINESS: 'This is not a real business',
  OTHER: 'Something else',
}
