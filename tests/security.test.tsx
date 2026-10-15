import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { describePasswordProblems, hashPassword, verifyPassword } from '@/lib/auth/password'
import { createToken, hashToken, hmac, ipHint, safeEquals } from '@/lib/auth/tokens'
import { Markdown } from '@/lib/markdown'
import { safeExternalUrl, slugify } from '@/lib/utils'

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('a reasonably long passphrase')
    expect(await verifyPassword('a reasonably long passphrase', hash)).toBe(true)
    expect(await verifyPassword('a reasonably long passphras', hash)).toBe(false)
  })

  it('never stores the password itself', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).not.toContain('correct horse')
    expect(hash.startsWith('scrypt$')).toBe(true)
  })

  it('salts, so the same password hashes differently each time', async () => {
    const [a, b] = await Promise.all([hashPassword('same passphrase'), hashPassword('same passphrase')])
    expect(a).not.toBe(b)
  })

  it('returns false rather than throwing on a missing or malformed hash', async () => {
    expect(await verifyPassword('anything', null)).toBe(false)
    expect(await verifyPassword('anything', 'garbage')).toBe(false)
    expect(await verifyPassword('anything', 'scrypt$x$y$z$q$r')).toBe(false)
  })

  it('enforces a minimum length and rejects obvious passwords', () => {
    expect(describePasswordProblems('short')).not.toHaveLength(0)
    expect(describePasswordProblems('unispace-admin-2026')).not.toHaveLength(0)
    expect(describePasswordProblems('a memorable campus phrase')).toHaveLength(0)
  })
})

describe('tokens', () => {
  it('produces URL-safe tokens with no padding', () => {
    const token = createToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeGreaterThan(32)
  })

  it('hashes tokens one-way', () => {
    const token = createToken()
    const hash = hashToken(token)
    expect(hash).not.toBe(token)
    expect(hashToken(token)).toBe(hash)
  })

  it('compares in constant time without throwing on different lengths', () => {
    expect(safeEquals('abc', 'abc')).toBe(true)
    expect(safeEquals('abc', 'abcd')).toBe(false)
  })

  it('derives an IP hint that is short and not the address', () => {
    const secret = 'x'.repeat(48)
    const hint = ipHint(secret, '197.234.1.9')
    expect(hint).not.toBeNull()
    expect(hint).not.toContain('197')
    expect(hint).toHaveLength(16)
    expect(ipHint(secret, null)).toBeNull()
  })

  it('keys the hint, so the same IP differs between deployments', () => {
    expect(ipHint('a'.repeat(48), '1.2.3.4')).not.toBe(ipHint('b'.repeat(48), '1.2.3.4'))
    expect(hmac('secret', 'value')).toBe(hmac('secret', 'value'))
  })
})

describe('external links', () => {
  it('allows only http and https', () => {
    expect(safeExternalUrl('https://www.example.ac.mw')).toBe('https://www.example.ac.mw/')
    expect(safeExternalUrl('http://example.org/path')).toBe('http://example.org/path')
  })

  it('drops dangerous schemes', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeExternalUrl('file:///etc/passwd')).toBeNull()
    expect(safeExternalUrl('not a url')).toBeNull()
    expect(safeExternalUrl(null)).toBeNull()
  })
})

describe('markdown rendering', () => {
  it('renders headings, lists and emphasis', () => {
    const html = renderToStaticMarkup(
      <Markdown source={'# Title\n\nSome **bold** text.\n\n- one\n- two\n'} />,
    )
    expect(html).toContain('<h1')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<li')
  })

  it('escapes raw HTML instead of executing it', () => {
    const html = renderToStaticMarkup(
      <Markdown source={'<script>alert("xss")</script>\n\n<img src=x onerror=alert(1)>'} />,
    )
    // The markup must contain no real tags from the source — they are escaped
    // into text, so `onerror` can never become an attribute.
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('refuses to render a javascript: link as a link', () => {
    const html = renderToStaticMarkup(
      <Markdown source={'[click me](javascript:alert(1))'} />,
    )
    expect(html).not.toContain('javascript:')
    expect(html).toContain('click me')
  })

  it('marks external links with rel protections', () => {
    const html = renderToStaticMarkup(<Markdown source={'[site](https://example.org)'} />)
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
  })
})

describe('slugify', () => {
  it('produces url-safe slugs', () => {
    expect(slugify('Malawi University of Science & Technology')).toBe(
      'malawi-university-of-science-technology',
    )
    expect(slugify('  Freshers’ Open Air 2026!  ')).toBe('freshers-open-air-2026')
  })
})
