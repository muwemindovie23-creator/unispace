import { z } from 'zod'

/**
 * Zod helpers for HTML form data.
 *
 * A browser omits a field entirely when it is not rendered, when a checkbox is
 * unticked, or when a `<select>` is conditionally hidden — so every optional
 * field must accept `undefined`, not just `""`. Treating a missing field as an
 * error produced "expected string, received undefined" on a form the user had
 * filled in correctly, which is why these live in one place now.
 */

/**
 * A string that may be missing entirely. Missing becomes "".
 *
 * `.optional()` is what makes the object key itself optional in Zod 4 — a
 * `z.union([z.string(), z.undefined()])` still reports the key as required
 * ("expected nonoptional, received undefined").
 */
const formString = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim())

/** Optional free text, capped. Empty or missing becomes null. */
export function optionalText(max: number) {
  return formString
    .refine((value) => value.length <= max, { message: `Use at most ${max} characters.` })
    .transform((value) => (value.length === 0 ? null : value))
}

/** Optional http(s) URL. Empty or missing becomes null. */
export const optionalUrl = formString
  .transform((value) => (value.length === 0 ? null : value))
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

/** An optional record id (from a select). Empty or missing becomes null. */
export const optionalId = formString.transform((value) =>
  value.length === 0 ? null : value,
)

/** A checkbox. Ticked sends "on"; unticked sends nothing at all. */
export const checkbox = formString.transform(
  (value) => value === 'on' || value === 'true',
)

/** An integer from a number input. Empty or missing becomes `fallback`. */
export function optionalInt(fallback: number, min: number, max: number) {
  return formString
    .transform((value) => (value.length === 0 ? fallback : Number(value)))
    .pipe(z.number().int('Use a whole number.').min(min).max(max))
}

/** An optional coordinate, validated to its real-world range. */
export function optionalCoordinate(limit: number, label: string) {
  return formString
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .refine((value) => value === null || (Number.isFinite(value) && Math.abs(value) <= limit), {
      message: `${label} must be between -${limit} and ${limit}.`,
    })
}

/** Required free text that must not contain markup. */
export function plainText(min: number, max: number, label: string) {
  return formString
    .refine((value) => value.length >= min, { message: `${label} is required.` })
    .refine((value) => value.length <= max, { message: `Use at most ${max} characters.` })
    .refine((value) => !/<\/?[a-zA-Z][^>]*>/.test(value), {
      message: 'Remove any HTML tags.',
    })
}

/** An optional email address. Empty or missing becomes null. */
export const optionalEmail = formString
  .transform((value) => (value.length === 0 ? null : value.toLowerCase()))
  .refine((value) => value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: 'Enter a valid email address, or leave it empty.',
  })

/** A required email address. */
export const requiredEmail = formString
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: 'Enter an email address we can reply to.',
  })

/** A URL slug. */
export const slugField = formString
  .transform((value) => value.toLowerCase())
  .refine((value) => value.length >= 2 && value.length <= 80, {
    message: 'Use between 2 and 80 characters.',
  })
  .refine((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
    message: 'Use lowercase letters, numbers and single hyphens.',
  })

/** An optional date from a date input. */
export const optionalDate = formString
  .transform((value) => (value.length === 0 ? null : new Date(value)))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    message: 'Enter a valid date.',
  })
