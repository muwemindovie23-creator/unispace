import { describe, expect, it } from 'vitest'

import {
  checkbox,
  optionalCoordinate,
  optionalEmail,
  optionalId,
  optionalInt,
  optionalText,
  optionalUrl,
  plainText,
  requiredEmail,
  slugField,
} from '@/lib/form-fields'
import { businessApplicationSchema } from '@/modules/businesses/schemas'

/**
 * A browser omits a form field entirely when it is not rendered, when a
 * checkbox is unticked, or when a <select> is conditionally hidden. Every
 * optional field must therefore accept `undefined`. This regressed once: a
 * university with no campuses did not render the campus <select>, so the whole
 * application form failed with "expected string, received undefined".
 */
describe('missing fields', () => {
  it('treats a missing optional text field as null', () => {
    expect(optionalText(100).parse(undefined)).toBeNull()
    expect(optionalText(100).parse('')).toBeNull()
    expect(optionalText(100).parse('  ')).toBeNull()
  })

  it('treats a missing optional id as null', () => {
    expect(optionalId.parse(undefined)).toBeNull()
    expect(optionalId.parse('')).toBeNull()
    expect(optionalId.parse('abc123')).toBe('abc123')
  })

  it('treats a missing checkbox as false', () => {
    expect(checkbox.parse(undefined)).toBe(false)
    expect(checkbox.parse('')).toBe(false)
    expect(checkbox.parse('on')).toBe(true)
  })

  it('treats a missing url, email, coordinate and number as empty', () => {
    expect(optionalUrl.parse(undefined)).toBeNull()
    expect(optionalEmail.parse(undefined)).toBeNull()
    expect(optionalCoordinate(90, 'Latitude').parse(undefined)).toBeNull()
    expect(optionalInt(7, 0, 100).parse(undefined)).toBe(7)
  })
})

describe('validation still bites', () => {
  it('rejects over-long text', () => {
    expect(optionalText(5).safeParse('far too long').success).toBe(false)
  })

  it('rejects non-http urls', () => {
    expect(optionalUrl.safeParse('javascript:alert(1)').success).toBe(false)
    expect(optionalUrl.safeParse('https://example.org').success).toBe(true)
  })

  it('rejects out-of-range coordinates', () => {
    expect(optionalCoordinate(90, 'Latitude').safeParse('91').success).toBe(false)
    expect(optionalCoordinate(90, 'Latitude').safeParse('-15.38').success).toBe(true)
  })

  it('rejects bad emails but accepts a real one', () => {
    expect(requiredEmail.safeParse('not-an-email').success).toBe(false)
    expect(requiredEmail.safeParse(undefined).success).toBe(false)
    expect(requiredEmail.safeParse('Someone@Example.COM').success).toBe(true)
    expect(requiredEmail.parse('Someone@Example.COM')).toBe('someone@example.com')
  })

  it('rejects markup in required prose but allows a bare less-than', () => {
    expect(plainText(1, 100, 'Field').safeParse('<script>alert(1)</script>').success).toBe(false)
    // Real copy a business might write.
    expect(plainText(1, 100, 'Field').safeParse('Prices < MK1000').success).toBe(true)
    expect(plainText(1, 100, 'Field').safeParse('Delivery < 30 mins').success).toBe(true)
  })

  it('enforces slug shape', () => {
    expect(slugField.parse('  Chirunga-Campus  ')).toBe('chirunga-campus')
    expect(slugField.safeParse('has space').success).toBe(false)
    expect(slugField.safeParse('-leading').success).toBe(false)
  })
})

describe('business application form', () => {
  const valid = {
    universityId: 'university-1',
    businessName: 'Test Print Shop',
    description: 'A long enough description of what this business offers students.',
    contactName: 'A Person',
    contactEmail: 'person@example.com',
    confirmAccurate: 'on',
  }

  it('accepts a submission with no campus select rendered', () => {
    // The exact shape that used to fail.
    const result = businessApplicationSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.campusId).toBeNull()
  })

  it('requires the accuracy confirmation', () => {
    const { confirmAccurate: _omitted, ...withoutTick } = valid
    const result = businessApplicationSchema.safeParse(withoutTick)
    expect(result.success).toBe(false)
  })

  it('requires a university', () => {
    expect(
      businessApplicationSchema.safeParse({ ...valid, universityId: '' }).success,
    ).toBe(false)
  })

  it('rejects markup in the description', () => {
    expect(
      businessApplicationSchema.safeParse({
        ...valid,
        description: '<iframe src="https://evil.example.com"></iframe> padding to reach length',
      }).success,
    ).toBe(false)
  })
})
