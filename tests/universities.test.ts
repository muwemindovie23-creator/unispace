import { describe, expect, it } from 'vitest'

import {
  campusSchema,
  slugField,
  universitySchema,
} from '@/modules/universities/schemas'
import {
  DEFAULT_SECTION_ORDER,
  HOMEPAGE_SECTIONS,
  isHomepageSectionKey,
} from '@/modules/universities/sections'

/** A complete, valid form submission, so each test can vary one field. */
const validUniversity = {
  name: 'University of Example',
  acronym: 'UOE',
  slug: 'university-of-example',
  shortDescription: 'Campus life at UOE.',
  longDescription: '',
  city: 'Zomba',
  logoUrl: '',
  coverImageUrl: '',
  profileStatus: 'IN_PROGRESS',
  displayOrder: '3',
}

const validCampus = {
  name: 'Chirunga Campus',
  slug: 'chirunga',
  kind: '',
  description: '',
  city: 'Zomba',
  profileStatus: 'COMING_SOON',
  displayOrder: '0',
}

describe('slug validation', () => {
  it('accepts lowercase hyphenated slugs', () => {
    expect(slugField.parse('chancellor-college')).toBe('chancellor-college')
    expect(slugField.parse('must2')).toBe('must2')
  })

  it('lowercases and trims', () => {
    expect(slugField.parse('  MUBAS  ')).toBe('mubas')
  })

  it('rejects slugs that would break a URL', () => {
    for (const bad of ['has space', 'Trailing-', '-leading', 'double--hyphen', 'em—dash', 'a', '']) {
      expect(slugField.safeParse(bad).success, `"${bad}" should be rejected`).toBe(false)
    }
  })
})

describe('university schema', () => {
  it('accepts a valid submission', () => {
    const result = universitySchema.safeParse(validUniversity)
    expect(result.success).toBe(true)
  })

  it('treats a missing checkbox as unpublished', () => {
    const result = universitySchema.parse(validUniversity)
    expect(result.isPublished).toBe(false)
  })

  it('treats a ticked checkbox as published', () => {
    const result = universitySchema.parse({ ...validUniversity, isPublished: 'on' })
    expect(result.isPublished).toBe(true)
  })

  it('turns empty optional text into null rather than an empty string', () => {
    const result = universitySchema.parse(validUniversity)
    expect(result.longDescription).toBeNull()
    expect(result.logoUrl).toBeNull()
  })

  it('coerces the display order to a number, defaulting to 0', () => {
    expect(universitySchema.parse(validUniversity).displayOrder).toBe(3)
    expect(universitySchema.parse({ ...validUniversity, displayOrder: '' }).displayOrder).toBe(0)
  })

  it('rejects a non-http image URL', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'not a url']) {
      const result = universitySchema.safeParse({ ...validUniversity, logoUrl: bad })
      expect(result.success, `"${bad}" should be rejected`).toBe(false)
    }
  })

  it('accepts https image URLs', () => {
    const result = universitySchema.safeParse({
      ...validUniversity,
      logoUrl: 'https://example.org/logo.png',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown profile status', () => {
    expect(
      universitySchema.safeParse({ ...validUniversity, profileStatus: 'SECRET' }).success,
    ).toBe(false)
  })

  it('requires a name and an acronym', () => {
    expect(universitySchema.safeParse({ ...validUniversity, name: 'x' }).success).toBe(false)
    expect(universitySchema.safeParse({ ...validUniversity, acronym: '' }).success).toBe(false)
  })
})

describe('campus schema', () => {
  it('accepts a valid submission', () => {
    expect(campusSchema.safeParse(validCampus).success).toBe(true)
  })

  it('defaults both flags to false when the checkboxes are absent', () => {
    const result = campusSchema.parse(validCampus)
    expect(result.isPrimary).toBe(false)
    expect(result.isPublished).toBe(false)
  })

  it('reads ticked checkboxes', () => {
    const result = campusSchema.parse({ ...validCampus, isPrimary: 'on', isPublished: 'on' })
    expect(result.isPrimary).toBe(true)
    expect(result.isPublished).toBe(true)
  })

  it('rejects a slug that collides with the campus route prefix rules', () => {
    expect(campusSchema.safeParse({ ...validCampus, slug: 'Chirunga Campus' }).success).toBe(false)
  })
})

describe('homepage section registry', () => {
  it('recognises every key in the default order', () => {
    for (const key of DEFAULT_SECTION_ORDER) {
      expect(isHomepageSectionKey(key)).toBe(true)
    }
  })

  it('rejects keys that are not in the registry', () => {
    // The save action filters submitted keys through this, so a forged key
    // from a client is discarded rather than written.
    for (const bad of ['', 'admin', 'constructor', '__proto__', 'events ', 'EVENTS']) {
      expect(isHomepageSectionKey(bad), `"${bad}" should not be a section key`).toBe(false)
    }
  })

  it('covers every registry entry in the default order', () => {
    expect([...DEFAULT_SECTION_ORDER].sort()).toEqual(Object.keys(HOMEPAGE_SECTIONS).sort())
  })

  it('gives every section a label and description for the dashboard', () => {
    for (const section of Object.values(HOMEPAGE_SECTIONS)) {
      expect(section.label.length).toBeGreaterThan(3)
      expect(section.description.length).toBeGreaterThan(10)
    }
  })
})
