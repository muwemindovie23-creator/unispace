import Link from 'next/link'

import { Container } from '@/components/ui/primitives'
import { HOMEPAGE_SECTIONS, DEFAULT_SECTION_ORDER } from '@/modules/universities/sections'

/**
 * University-scoped header. The nav is a horizontally scrollable pill row on
 * small screens — reachable with a thumb, no JavaScript, and it keeps every
 * section one tap away rather than hiding them behind a menu button.
 */
export function UniversityHeader({
  name,
  acronym,
  slug,
  logoUrl,
}: {
  name: string
  acronym: string
  slug: string
  logoUrl: string | null
}) {
  const base = `/universities/${slug}`
  const navItems = DEFAULT_SECTION_ORDER.filter(
    (key) => HOMEPAGE_SECTIONS[key].href !== null,
  ).map((key) => ({
    label: HOMEPAGE_SECTIONS[key].label.split(/[&—]/)[0].trim(),
    href: `${base}/${HOMEPAGE_SECTIONS[key].href}`,
  }))

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href={base} className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand px-0.5 text-center text-[0.55rem] font-black leading-tight text-brand-contrast">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              // Full acronym, never truncated.
              acronym
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight tracking-tight text-content">
              {name}
            </span>
            <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-content-muted">
              on UniSpace
            </span>
          </span>
        </Link>

        <Link
          href="/"
          className="shrink-0 rounded-full border border-hairline px-3.5 py-2 text-xs font-bold text-content-muted transition-colors hover:border-brand hover:text-brand"
        >
          Switch university
        </Link>
      </Container>

      <nav aria-label={`${acronym} sections`} className="border-t border-hairline/70">
        <Container className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max items-center gap-1 py-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold text-content-muted transition-colors hover:bg-highlight hover:text-content"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </header>
  )
}
