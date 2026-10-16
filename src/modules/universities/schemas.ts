import { z } from 'zod'

import {
  checkbox,
  optionalInt,
  optionalText,
  optionalUrl,
  plainText,
  slugField,
} from '@/lib/form-fields'

/**
 * Server-side validation for university and campus editing.
 *
 * Every mutation parses its input through these before touching the database.
 * Nothing here trusts a value because the form produced it. The field helpers
 * all tolerate a missing key, because a browser omits fields that are not
 * rendered — see lib/form-fields.ts.
 */

export { slugField }

export const profileStatusField = z.enum(['COMING_SOON', 'IN_PROGRESS', 'COMPLETE'])

export const universitySchema = z.object({
  name: plainText(3, 160, 'The full university name'),
  acronym: plainText(2, 16, 'The acronym'),
  slug: slugField,
  shortDescription: optionalText(400),
  longDescription: optionalText(4000),
  city: optionalText(120),
  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  profileStatus: profileStatusField,
  isPublished: checkbox,
  displayOrder: optionalInt(0, 0, 9999),
})

export type UniversityInput = z.infer<typeof universitySchema>

export const campusSchema = z.object({
  name: plainText(2, 160, 'The campus name'),
  slug: slugField,
  kind: optionalText(80),
  description: optionalText(2000),
  city: optionalText(120),
  profileStatus: profileStatusField,
  isPrimary: checkbox,
  isPublished: checkbox,
  displayOrder: optionalInt(0, 0, 9999),
})

export type CampusInput = z.infer<typeof campusSchema>
