import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'

import './globals.css'

/**
 * Typography matches mentmw.org so the two products read as one family:
 * Sora for headings, Inter for body text.
 *
 * The files are self-hosted rather than pulled through `next/font/google`,
 * deliberately:
 *   - the build no longer depends on Google being reachable, which broke it;
 *   - visitors' browsers make no request to Google for fonts, so there is one
 *     less third party to disclose and one less round trip.
 * Both are variable fonts covering the latin subset.
 *
 * The CSS variables are named after the typefaces, not their role:
 * `--font-display` is a Tailwind theme key in globals.css, and reusing that
 * name here would make it refer to itself.
 */
const heading = localFont({
  src: './fonts/sora-latin.woff2',
  display: 'swap',
  weight: '400 800',
  variable: '--font-sora',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

const body = localFont({
  src: './fonts/inter-latin.woff2',
  display: 'swap',
  weight: '400 700',
  variable: '--font-inter',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'UniSpace — Your campus. Your people. Your experience.',
    template: '%s · UniSpace',
  },
  description:
    'UniSpace brings campus life together: campus businesses, a virtual campus tour, events, student representatives, campus tips and polls across Malawi’s universities.',
  openGraph: {
    type: 'website',
    siteName: 'UniSpace',
    title: 'UniSpace — Your campus. Your people. Your experience.',
    description:
      'One platform. Different campus worlds. One student community. Discover campus businesses, a virtual campus tour, events, student representatives and campus tips.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#00727a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-canvas font-sans text-content antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-50 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
