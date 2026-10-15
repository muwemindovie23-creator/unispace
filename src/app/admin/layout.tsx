import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s · UniSpace admin',
  },
  // The whole administrator area stays out of search results.
  robots: { index: false, follow: false },
}

export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  return children
}
