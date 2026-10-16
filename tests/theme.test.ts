import { readFileSync } from 'node:fs'
 import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  auditThemeContrast,
  contrastRatio,
  DEFAULT_THEME,
  parseHexColor,
  themeToCssVariables,
  type ThemeTokens,
} from '@/lib/theme/tokens'
import { INITIAL_UNIVERSITIES } from '../prisma/seed-data'

describe('colour parsing', () => {
  it('accepts three- and six-digit hex', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHexColor('#1d4ed8')).toEqual({ r: 29, g: 78, b: 216 })
  })

  it('rejects anything that is not a hex colour', () => {
    expect(parseHexColor('red')).toBeNull()
    expect(parseHexColor('rgb(0,0,0)')).toBeNull()
    expect(parseHexColor('#12345')).toBeNull()
    expect(parseHexColor('')).toBeNull()
  })
})

describe('contrast ratio', () => {
  it('matches the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('returns null when a colour cannot be parsed', () => {
    expect(contrastRatio('not-a-colour', '#ffffff')).toBeNull()
  })
})

describe('css variables', () => {
  it('maps every token to a --us-* custom property', () => {
    const style = themeToCssVariables(DEFAULT_THEME)
    expect(style['--us-primary']).toBe(DEFAULT_THEME.primaryColor)
    expect(style['--us-text']).toBe(DEFAULT_THEME.textPrimaryColor)
    expect(style['--us-radius']).toBe(DEFAULT_THEME.radius)
  })

  it('falls back to the UniSpace theme for a university with no theme row', () => {
    const style = themeToCssVariables(null)
    expect(style['--us-primary']).toBe(DEFAULT_THEME.primaryColor)
  })

  it('merges a partial theme over the defaults', () => {
    const style = themeToCssVariables({ primaryColor: '#123456' })
    expect(style['--us-primary']).toBe('#123456')
    expect(style['--us-surface']).toBe(DEFAULT_THEME.surfaceColor)
  })
})

describe('accessibility of shipped themes', () => {
  it('passes WCAG AA on the UniSpace default theme', () => {
    for (const finding of auditThemeContrast(DEFAULT_THEME)) {
      expect(finding.passes, `${finding.pair} was ${finding.ratio}:1`).toBe(true)
    }
  })

  // A university's brand colours must never make its pages unreadable. The
  // publish action enforces this at runtime; this test enforces it for the
  // themes we ship.
  it.each(INITIAL_UNIVERSITIES.map((university) => [university.acronym, university] as const))(
    'passes WCAG AA on the seeded %s theme',
    (_acronym, university) => {
      for (const finding of auditThemeContrast(university.theme as ThemeTokens)) {
        expect(finding.passes, `${finding.pair} was ${finding.ratio}:1`).toBe(true)
      }
    },
  )
})

describe('seed data honesty', () => {
  it('asserts no campuses for any university', () => {
    for (const university of INITIAL_UNIVERSITIES) {
      expect(Object.keys(university)).not.toContain('campuses')
    }
  })

  it('records how every official website was established, or why none is set', () => {
    for (const university of INITIAL_UNIVERSITIES) {
      expect(university.officialWebsiteNote.length).toBeGreaterThan(20)
      if (university.officialWebsite) {
        expect(university.officialWebsite.startsWith('https://')).toBe(true)
      }
    }
  })

  it('records the provenance of every palette', () => {
    for (const university of INITIAL_UNIVERSITIES) {
      expect(university.themeSourceNote).toMatch(/NOT official|not a confirmed brand/i)
    }
  })

  it('uses unique slugs', () => {
    const slugs = INITIAL_UNIVERSITIES.map((university) => university.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('house theme matches the stylesheet', () => {
  // DEFAULT_THEME (server-rendered fallback) and the `:root` block in
  // globals.css (what the browser uses before any ThemeScope) must agree, or
  // pages outside a university render one palette and universities fall back
  // to another. Two sources of truth, so this pins them together.
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
  const rootBlock = /:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''

  const readVar = (name: string) =>
    new RegExp(`${name}\s*:\s*([^;]+);`).exec(rootBlock)?.[1].split('/*')[0].trim()

  const pairs: [string, keyof typeof DEFAULT_THEME][] = [
    ['--us-primary', 'primaryColor'],
    ['--us-primary-contrast', 'primaryContrast'],
    ['--us-secondary', 'secondaryColor'],
    ['--us-secondary-contrast', 'secondaryContrast'],
    ['--us-accent', 'accentColor'],
    ['--us-accent-contrast', 'accentContrast'],
    ['--us-background', 'backgroundColor'],
    ['--us-surface', 'surfaceColor'],
    ['--us-surface-muted', 'surfaceMutedColor'],
    ['--us-text', 'textPrimaryColor'],
    ['--us-text-muted', 'textSecondaryColor'],
    ['--us-border', 'borderColor'],
    ['--us-highlight', 'highlightColor'],
    ['--us-radius', 'radius'],
  ]

  it.each(pairs)('%s matches DEFAULT_THEME.%s', (cssVar, token) => {
    expect(readVar(cssVar)).toBe(DEFAULT_THEME[token])
  })
})
