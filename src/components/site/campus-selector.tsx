import { Building2, Check } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export interface CampusOption {
  id: string
  slug: string
  name: string
  isPrimary: boolean
}

/**
 * Reusable campus selector.
 *
 * Rendered only where a university actually has more than one published
 * campus — a single-campus university gets no pointless control. It is a row
 * of links, so it works without JavaScript and each campus has a shareable URL.
 */
export function CampusSelector({
  universitySlug,
  campuses,
  activeCampusSlug,
  className,
}: {
  universitySlug: string
  campuses: CampusOption[]
  /** null means the university-wide view is active. */
  activeCampusSlug: string | null
  className?: string
}) {
  if (campuses.length < 2) return null

  const base = `/universities/${universitySlug}`

  return (
    <nav aria-label="Choose a campus" className={cn('w-full', className)}>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-content-muted">
        Viewing
      </p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <CampusChip href={base} isActive={activeCampusSlug === null}>
            All campuses
          </CampusChip>
        </li>
        {campuses.map((campus) => (
          <li key={campus.id}>
            <CampusChip
              href={`${base}/campus/${campus.slug}`}
              isActive={activeCampusSlug === campus.slug}
            >
              {campus.name}
            </CampusChip>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function CampusChip({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
        isActive
          ? 'border-brand bg-brand text-brand-contrast'
          : 'border-hairline bg-surface text-content-muted hover:border-brand hover:text-content',
      )}
    >
      {isActive ? (
        <Check aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <Building2 aria-hidden className="h-3.5 w-3.5" />
      )}
      {children}
    </Link>
  )
}
