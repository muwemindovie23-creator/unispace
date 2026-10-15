import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import './globals.css'

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'UniSpace — Your campus. Your people. Your experience.',
    template: '%s · UniSpace',
  },
  description:
    'UniSpace brings campus life together: events, student representatives, societies, campus tips, polls and student-focused businesses across Malawi’s universities.',
  openGraph: {
    type: 'website',
    siteName: 'UniSpace',
    title: 'UniSpace — Your campus. Your people. Your experience.',
    description:
      'One platform. Different campus worlds. One student community. Discover events, societies, student representatives and campus tips.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#4f2fd7',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
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
