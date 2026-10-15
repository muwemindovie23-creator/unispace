import { z } from 'zod'

/**
 * Server-side validation for university and campus editing.
 *
 * Every mutation parses its input through these before touching the database.
 * Nothing here trusts a value because the form produced it.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Use at least 2 characters.')
  .max(60, 'Use at most 60 characters.')
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and single hyphens, e.g. “chancellor-college”.')

/** Optional text field: an empty form input becomes null, not "". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters.`)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()

/** Only http(s) URLs are ever stored for images or links. */
const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .refine(
    (value) => {
      if (value === null) return true
      try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'Enter a full http(s) URL, or leave it empty.' },
  )

export const profileStatusField = z.enum(['COMING_SOON', 'IN_PROGRESS', 'COMPLETE'])

/** Checkbox inputs arrive as "on" when ticked and are absent otherwise. */
const checkboxField = z
  .union([z.literal('on'), z.literal('true'), z.literal('')])
  .optional()
  .transform((value) => value === 'on' || value === 'true')

const displayOrderField = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? 0 : Number(value)))
  .pipe(z.number().int('Use a whole number.').min(0).max(9999))

export const universitySchema = z.object({
  name: z.string().trim().min(3, 'Enter the full university name.').max(160),
  acronym: z.string().trim().min(2, 'Enter the acronym.').max(16),
  slug: slugField,
  shortDescription: optionalText(400),
  longDescription: optionalText(4000),
  city: optionalText(120),
  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  profileStatus: profileStatusField,
  isPublished: checkboxField,
  displayOrder: displayOrderField,
})

export type UniversityInput = z.infer<typeof universitySchema>

export const campusSchema = z.object({
  name: z.string().trim().min(2, 'Enter the campus name.').max(160),
  slug: slugField,
  kind: optionalText(80),
  description: optionalText(2000),
  city: optionalText(120),
  profileStatus: profileStatusField,
  isPrimary: checkboxField,
  isPublished: checkboxField,
  displayOrder: displayOrderField,
})

export type CampusInput = z.infer<typeof campusSchema>

/**
 * Homepage section configuration. The form posts one entry per section; the
 * action filters to keys that exist in the code-side registry, so an unknown
 * key submitted by a client is discarded rather than stored.
 */
export const homepageSectionsSchema = z.object({
  sectionKeys: z.array(z.string().trim().min(1).max(40)).max(50),
  enabledKeys: z.array(z.string().trim().min(1).max(40)).max(50),
})
