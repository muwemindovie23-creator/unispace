import Image from 'next/image'
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
        <Link href="/" aria-label="UniSpace home" className="group flex items-center gap-2.5">
          <Image
            src="/logo-mark.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6"
          />
          <span className="text-lg font-extrabold tracking-tight">
            <span className="text-[#0b2c5c]">Uni</span>
            <span className="text-[#039e96]">Space</span>
          </span>
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
