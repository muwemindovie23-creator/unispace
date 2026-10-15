/**
 * The theme contract.
 *
 * A university's identity is data, not code. Components only ever read these
 * CSS custom properties (or the Tailwind utilities mapped onto them in
 * globals.css). No component may reference a named university or a hard-coded
 * brand colour — that is what makes one codebase serve every campus.
 */

export interface ThemeTokens {
  primaryColor: string
  primaryContrast: string
  secondaryColor: string
  secondaryContrast: string
  accentColor: string
  accentContrast: string
  backgroundColor: string
  surfaceColor: string
  surfaceMutedColor: string
  textPrimaryColor: string
  textSecondaryColor: string
  borderColor: string
  highlightColor: string
  radius: string
  decorativePatternUrl?: string | null
}

/**
 * The UniSpace house theme, used on the university-selection homepage and on
 * every page outside a university, and as the fallback for a university whose
 * theme has not been configured yet.
 */
export const DEFAULT_THEME: ThemeTokens = {
  primaryColor: '#4f2fd7',
  primaryContrast: '#ffffff',
  secondaryColor: '#0f172a',
  secondaryContrast: '#ffffff',
  accentColor: '#ff7a1a',
  accentContrast: '#1f1300',
  backgroundColor: '#fbfaff',
  surfaceColor: '#ffffff',
  surfaceMutedColor: '#f3f1fd',
  textPrimaryColor: '#160f33',
  textSecondaryColor: '#5b5676',
  borderColor: '#e6e2f7',
  highlightColor: '#ece7ff',
  radius: '1.25rem',
  decorativePatternUrl: null,
}

const CSS_VARIABLE_BY_TOKEN: Record<keyof Omit<ThemeTokens, 'decorativePatternUrl'>, string> = {
  primaryColor: '--us-primary',
  primaryContrast: '--us-primary-contrast',
  secondaryColor: '--us-secondary',
  secondaryContrast: '--us-secondary-contrast',
  accentColor: '--us-accent',
  accentContrast: '--us-accent-contrast',
  backgroundColor: '--us-background',
  surfaceColor: '--us-surface',
  surfaceMutedColor: '--us-surface-muted',
  textPrimaryColor: '--us-text',
  textSecondaryColor: '--us-text-muted',
  borderColor: '--us-border',
  highlightColor: '--us-highlight',
  radius: '--us-radius',
}

/** Turns a theme row into inline CSS custom properties for a wrapper element. */
export function themeToCssVariables(theme: Partial<ThemeTokens> | null | undefined): Record<string, string> {
  const merged = { ...DEFAULT_THEME, ...(theme ?? {}) }
  const style: Record<string, string> = {}

  for (const [token, variable] of Object.entries(CSS_VARIABLE_BY_TOKEN)) {
    const value = merged[token as keyof typeof CSS_VARIABLE_BY_TOKEN]
    if (typeof value === 'string' && value.length > 0) style[variable] = value
  }

  return style
}

// ---------------------------------------------------------------------------
// Accessibility helpers — used by the theme editor to warn before publishing
// ---------------------------------------------------------------------------

/** Accepts #rgb, #rrggbb. Returns null for anything it cannot parse. */
export function parseHexColor(value: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim())
  if (!match) return null

  let hex = match[1]
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  }
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (value: number) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.1 contrast ratio, 1–21. Returns null if either colour is unparseable. */
export function contrastRatio(foreground: string, background: string): number | null {
  const fg = parseHexColor(foreground)
  const bg = parseHexColor(background)
  if (!fg || !bg) return null

  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg))
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg))
  return (lighter + 0.05) / (darker + 0.05)
}

export interface ContrastFinding {
  pair: string
  ratio: number | null
  required: number
  passes: boolean
}

/**
 * Checks the colour pairings a visitor actually reads. The theme editor shows
 * these before a theme can be published, so a university's brand colours cannot
 * quietly make its pages unreadable.
 */
export function auditThemeContrast(theme: ThemeTokens): ContrastFinding[] {
  const checks: { pair: string; fg: string; bg: string; required: number }[] = [
    { pair: 'Body text on page background', fg: theme.textPrimaryColor, bg: theme.backgroundColor, required: 4.5 },
    { pair: 'Body text on cards', fg: theme.textPrimaryColor, bg: theme.surfaceColor, required: 4.5 },
    { pair: 'Muted text on cards', fg: theme.textSecondaryColor, bg: theme.surfaceColor, required: 4.5 },
    { pair: 'Primary button label', fg: theme.primaryContrast, bg: theme.primaryColor, required: 4.5 },
    { pair: 'Secondary button label', fg: theme.secondaryContrast, bg: theme.secondaryColor, required: 4.5 },
    { pair: 'Accent button label', fg: theme.accentContrast, bg: theme.accentColor, required: 4.5 },
    { pair: 'Text on highlight panels', fg: theme.textPrimaryColor, bg: theme.highlightColor, required: 4.5 },
  ]

  return checks.map(({ pair, fg, bg, required }) => {
    const ratio = contrastRatio(fg, bg)
    return {
      pair,
      ratio: ratio === null ? null : Math.round(ratio * 100) / 100,
      required,
      passes: ratio !== null && ratio >= required,
    }
  })
}
