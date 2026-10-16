import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/primitives'

/**
 * Header for pages outside a university. University pages get their own
 * campus-aware header in Milestone 2.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-canvas/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-black text-brand-contrast transition-transform duration-300 group-hover:-rotate-6"
          >
            US
          </span>
          <span className="text-base font-extrabold tracking-tight text-content">UniSpace</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <HeaderLink href="/">Universities</HeaderLink>
          <HeaderLink href="/businesses/verify">For businesses</HeaderLink>
          <HeaderLink href="/advertise">Advertise</HeaderLink>
          <HeaderLink href="/contact">Contact</HeaderLink>
        </nav>

        <ButtonLink href="#universities" variant="accent" size="sm" className="md:hidden">
          Explore
        </ButtonLink>
        <ButtonLink href="#universities" variant="accent" size="sm" className="hidden md:inline-flex">
          Choose your campus
        </ButtonLink>
      </Container>
    </header>
  )
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3.5 py-2 text-sm font-semibold text-content-muted transition-colors hover:bg-surface-muted hover:text-content"
    >
      {children}
    </Link>
  )
}
