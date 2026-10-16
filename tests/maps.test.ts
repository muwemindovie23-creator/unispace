import { describe, expect, it } from 'vitest'

import {
  extractEmbedSrc,
  isAllowedMapEmbedUrl,
  looksLikeHtml,
  normaliseMapEmbedInput,
  resolveMapEmbedUrl,
  resolveMapLinkUrl,
} from '@/lib/maps'

const GOOGLE_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000'
const GOOGLE_OUTPUT_EMBED = 'https://www.google.com/maps?q=-15.38,35.31&output=embed'

describe('embed URL allow-list', () => {
  it('accepts Google Maps embed URLs', () => {
    expect(isAllowedMapEmbedUrl(GOOGLE_EMBED)).toBe(true)
    expect(isAllowedMapEmbedUrl(GOOGLE_OUTPUT_EMBED)).toBe(true)
    expect(isAllowedMapEmbedUrl('https://maps.google.com/maps?q=x&output=embed')).toBe(true)
  })

  it('rejects non-Google hosts, however plausible', () => {
    for (const bad of [
      'https://evil.example.com/maps/embed?pb=1',
      'https://www.google.com.evil.example/maps/embed',
      'https://notgoogle.com/maps/embed',
      // A lookalike host that merely contains "google.com".
      'https://google.com.attacker.net/maps/embed',
    ]) {
      expect(isAllowedMapEmbedUrl(bad), `${bad} should be rejected`).toBe(false)
    }
  })

  it('rejects non-https schemes', () => {
    expect(isAllowedMapEmbedUrl('http://www.google.com/maps/embed?pb=1')).toBe(false)
    expect(isAllowedMapEmbedUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedMapEmbedUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects a normal Maps link, which browsers refuse to frame anyway', () => {
    expect(isAllowedMapEmbedUrl('https://www.google.com/maps/place/Zomba')).toBe(false)
    expect(isAllowedMapEmbedUrl('https://www.google.com/search?q=maps')).toBe(false)
  })

  it('rejects empty and malformed input', () => {
    expect(isAllowedMapEmbedUrl('')).toBe(false)
    expect(isAllowedMapEmbedUrl(null)).toBe(false)
    expect(isAllowedMapEmbedUrl('not a url')).toBe(false)
  })
})

describe('iframe snippet handling', () => {
  it('extracts the src from a pasted Google iframe', () => {
    const snippet = `<iframe src="${GOOGLE_EMBED}" width="600" height="450" style="border:0;" allowfullscreen loading="lazy"></iframe>`
    expect(extractEmbedSrc(snippet)).toBe(GOOGLE_EMBED)
  })

  it('refuses an iframe pointing anywhere else', () => {
    const snippet = '<iframe src="https://evil.example.com/steal" width="600"></iframe>'
    expect(extractEmbedSrc(snippet)).toBeNull()
    expect(normaliseMapEmbedInput(snippet)).toBeNull()
  })

  it('never returns markup, only a URL', () => {
    const snippet = `<iframe src="${GOOGLE_EMBED}"></iframe><script>alert(1)</script>`
    const result = normaliseMapEmbedInput(snippet)
    expect(result).toBe(GOOGLE_EMBED)
    expect(result).not.toContain('<')
  })

  it('detects markup so free-text fields can reject it', () => {
    expect(looksLikeHtml('<script>alert(1)</script>')).toBe(true)
    expect(looksLikeHtml('<iframe src=x>')).toBe(true)
    expect(looksLikeHtml('</div>')).toBe(true)
    expect(looksLikeHtml('Open 8am - 5pm, cash only')).toBe(false)
    expect(looksLikeHtml('Prices < MK1000')).toBe(false)
  })
})

describe('resolving what to render', () => {
  it('prefers an administrator-supplied embed', () => {
    expect(
      resolveMapEmbedUrl({ mapEmbedUrl: GOOGLE_EMBED, latitude: 1, longitude: 2 }),
    ).toBe(GOOGLE_EMBED)
  })

  it('falls back to coordinates', () => {
    const url = resolveMapEmbedUrl({ latitude: -15.3869, longitude: 35.3188 })
    expect(url).toContain('output=embed')
    expect(url).toContain(encodeURIComponent('-15.3869,35.3188'))
  })

  it('falls back to a place query last', () => {
    const url = resolveMapEmbedUrl({ placeQuery: 'Zomba Campus Library' })
    expect(url).toContain(encodeURIComponent('Zomba Campus Library'))
  })

  it('returns null when there is nothing trustworthy to show', () => {
    expect(resolveMapEmbedUrl({})).toBeNull()
    expect(resolveMapEmbedUrl({ mapEmbedUrl: 'https://evil.example.com/x' })).toBeNull()
    expect(resolveMapEmbedUrl({ placeQuery: 'a' })).toBeNull()
  })

  it('ignores out-of-range coordinates rather than rendering a wrong pin', () => {
    expect(resolveMapEmbedUrl({ latitude: 999, longitude: 35 })).toBeNull()
    expect(resolveMapEmbedUrl({ latitude: -15, longitude: 999 })).toBeNull()
    expect(resolveMapEmbedUrl({ latitude: Number.NaN, longitude: 35 })).toBeNull()
  })

  it('discards a stored value that is no longer allowed', () => {
    // Defence in depth: even if something bad reached the database, it is not
    // rendered.
    expect(resolveMapEmbedUrl({ mapEmbedUrl: 'javascript:alert(1)' })).toBeNull()
  })

  it('builds an open-in-Maps link only when it has a location', () => {
    expect(resolveMapLinkUrl({ latitude: -15.38, longitude: 35.31 })).toContain('api=1')
    expect(resolveMapLinkUrl({})).toBeNull()
  })
})
