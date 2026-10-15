'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { ArrowRight, MapPin, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/primitives'
import { themeToCssVariables } from '@/lib/theme/tokens'
import type { UniversityCard } from '@/modules/universities/queries'
import { cn } from '@/lib/utils'

const PROFILE_LABEL: Record<UniversityCard['profileStatus'], string | null> = {
  COMPLETE: null,
  IN_PROGRESS: 'Profile being built',
  COMING_SOON: 'Coming soon',
}

export function UniversityExplorer({ universities }: { universities: UniversityCard[] }) {
  const [query, setQuery] = useState('')
  const reduceMotion = useReducedMotion()

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return universities
    return universities.filter(
      (university) =>
        university.name.toLowerCase().includes(needle) ||
        university.acronym.toLowerCase().includes(needle),
    )
  }, [query, universities])

  return (
    <div>
      <div className="mx-auto mb-10 max-w-xl">
        <label htmlFor="university-search" className="sr-only">
          Search universities by name or acronym
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted"
          />
          <input
            id="university-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or acronym, e.g. MUST"
            autoComplete="off"
            className="h-14 w-full rounded-theme border-2 border-hairline bg-surface pl-12 pr-4 text-base text-content shadow-sm transition-colors placeholder:text-content-muted/80 focus:border-brand focus:outline-none"
          />
        </div>
        <p aria-live="polite" className="mt-2 text-center text-sm text-content-muted">
          {results.length === universities.length
            ? `${universities.length} universities available`
            : `${results.length} of ${universities.length} universities match “${query.trim()}”`}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-theme border border-dashed border-hairline bg-surface-muted/60 p-10 text-center">
          <h3 className="text-lg font-bold text-content">No university matches that search</h3>
          <p className="mt-2 text-sm text-content-muted">
            Try an acronym such as UNIMA or MUBAS. More universities are added over time.
          </p>
        </div>
      ) : (
        <motion.ul
          layout={!reduceMotion}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((university, index) => (
              <motion.li
                key={university.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
                transition={{
                  duration: 0.35,
                  delay: reduceMotion ? 0 : Math.min(index * 0.05, 0.3),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <UniversityTile university={university} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  )
}

function UniversityTile({ university }: { university: UniversityCard }) {
  const statusLabel = PROFILE_LABEL[university.profileStatus]
  const themeVars = themeToCssVariables(university.theme)

  return (
    <Link
      href={`/universities/${university.slug}`}
      style={themeVars}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-theme border border-hairline bg-surface',
        'transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5',
        'hover:shadow-[0_18px_40px_-18px_var(--us-primary)] motion-reduce:hover:translate-y-0',
      )}
    >
      {/* Each card previews its own university's theme colours. */}
      <div className="relative h-28 overflow-hidden bg-brand">
        {university.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={university.coverImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="h-full w-full opacity-90"
            style={{
              backgroundImage:
                'radial-gradient(circle at 18% 20%, var(--us-accent) 0%, transparent 42%), radial-gradient(circle at 82% 70%, var(--us-secondary) 0%, transparent 46%)',
            }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="-mt-12 mb-3 flex items-start justify-between gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
            {university.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={university.logoUrl}
                alt={`${university.name} logo`}
                loading="lazy"
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              // Never truncate an acronym — LUANAR must not render as "LUANA".
              <span className="px-1 text-center text-[0.65rem] font-black leading-tight tracking-tight text-brand">
                {university.acronym}
              </span>
            )}
          </span>
          {statusLabel ? (
            <Badge tone="muted" className="mt-12">
              {statusLabel}
            </Badge>
          ) : null}
        </div>

        <h3 className="text-base font-extrabold leading-snug tracking-tight text-content">
          {university.name}
        </h3>
        {/* No `uppercase`: it would render KUHeS as KUHES. */}
        <p className="mt-1 text-xs font-bold tracking-[0.14em] text-brand">
          {university.acronym}
        </p>

        {university.shortDescription ? (
          <p className="mt-3 line-clamp-3 text-sm text-content-muted">
            {university.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-muted">
            {university.campusCount > 0 ? (
              <>
                <MapPin aria-hidden className="h-3.5 w-3.5" />
                {university.campusCount} {university.campusCount === 1 ? 'campus' : 'campuses'}
              </>
            ) : (
              <>
                <Sparkles aria-hidden className="h-3.5 w-3.5" />
                Campuses being added
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-brand-contrast transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0">
            Explore
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
