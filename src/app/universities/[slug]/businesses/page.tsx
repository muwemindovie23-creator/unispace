import { BadgeCheck, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BusinessCard } from '@/components/site/business-card'
import { CampusSelector } from '@/components/site/campus-selector'
import { SiteFooter } from '@/components/site/site-footer'
import { ThemeScope } from '@/components/site/theme-scope'
import { UniversityHeader } from '@/components/site/university-header'
import { ButtonLink } from '@/components/ui/button'
import { Card, Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import {
  listBusinessCategories,
  listPublishedBusinesses,
} from '@/modules/businesses/queries'
import { getPublishedUniversityBySlug } from '@/modules/universities/queries'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const university = await getPublishedUniversityBySlug(slug)
  if (!university) return { title: 'University not found' }

  return {
    title: `Campus businesses · ${university.acronym}`,
    description: `Food, printing, laundry, barbers and the everyday services students use around ${university.name}.`,
    alternates: { canonical: `/universities/${slug}/businesses` },
  }
}

export default async function BusinessesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; campus?: string; q?: string }>
}) {
  const { slug } = await params
  const { category, campus, q } = await searchParams

  const university = await getPublishedUniversityBySlug(slug)
  if (!university) notFound()

  const [businesses, categories] = await Promise.all([
    listPublishedBusinesses(slug, {
      categorySlug: category ?? null,
      campusSlug: campus ?? null,
      query: q ?? null,
    }),
    listBusinessCategories(slug),
  ])

  const hasFilters = Boolean(category || campus || q)

  return (
    <ThemeScope theme={university.theme} className="min-h-dvh">
      <UniversityHeader
        name={university.name}
        acronym={university.acronym}
        slug={university.slug}
        logoUrl={university.logoUrl}
      />

      <main id="main" className="py-10">
        <Container>
          <CampusSelector
            universitySlug={university.slug}
            campuses={university.campuses}
            activeCampusSlug={campus ?? null}
            className="mb-8"
          />

          <SectionHeading
            eyebrow={university.acronym}
            title="Campus businesses"
            description="The everyday services around campus — food, printing, laundry, barbers and more. Opening hours and prices change, so check before you travel."
            className="mb-6"
            action={
              <ButtonLink href="/businesses/verify" variant="outline" size="sm">
                List your business
              </ButtonLink>
            }
          />

          {/* -------------------------------------------------- Filter bar */}
          {categories.length > 0 ? (
            <nav aria-label="Filter by category" className="mb-6">
              <ul className="flex flex-wrap gap-2">
                <li>
                  <FilterChip
                    href={`/universities/${slug}/businesses${campus ? `?campus=${campus}` : ''}`}
                    isActive={!category}
                  >
                    All
                  </FilterChip>
                </li>
                {categories.map((item) => {
                  const query = new URLSearchParams()
                  query.set('category', item.slug)
                  if (campus) query.set('campus', campus)
                  return (
                    <li key={item.slug}>
                      <FilterChip
                        href={`/universities/${slug}/businesses?${query.toString()}`}
                        isActive={category === item.slug}
                      >
                        {item.label} ({item.count})
                      </FilterChip>
                    </li>
                  )
                })}
              </ul>
            </nav>
          ) : null}

          {/* ------------------------------------------- What verified means */}
          <Card className="mb-8 bg-highlight/60">
            <div className="flex gap-3">
              <BadgeCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <h2 className="text-sm font-bold text-content">
                  What the “Verified” badge means
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  It means we checked the listing’s identity and contact details on the date shown
                  — nothing more. It is <strong>not</strong> a statement that a business is
                  licensed, safe, good value, currently open, or endorsed by {university.acronym}.
                  Listings marked “Sponsored” paid for placement; paying never affects
                  verification.
                </p>
              </div>
            </div>
          </Card>

          {businesses.length === 0 ? (
            <EmptyState
              icon={<Store className="h-6 w-6" />}
              title={hasFilters ? 'No businesses match those filters' : 'No businesses listed yet'}
              description={
                hasFilters
                  ? 'Try removing a filter, or browse all categories.'
                  : `Listings appear here once a business has applied and been reviewed. UniSpace does not invent businesses to fill this page.`
              }
              action={
                hasFilters ? (
                  <ButtonLink
                    href={`/universities/${slug}/businesses`}
                    variant="outline"
                    size="sm"
                  >
                    Clear filters
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/businesses/verify" size="sm">
                    Apply to be listed
                  </ButtonLink>
                )
              }
            />
          ) : (
            <>
              <p aria-live="polite" className="mb-4 text-sm text-content-muted">
                {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'}
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business, index) => (
                  <li key={business.id}>
                    <BusinessCard
                      business={business}
                      universitySlug={university.slug}
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Container>
      </main>

      <SiteFooter />
    </ThemeScope>
  )
}

function FilterChip({
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
      className={`inline-block rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        isActive
          ? 'border-brand bg-brand text-brand-contrast'
          : 'border-hairline bg-surface text-content-muted hover:border-brand hover:text-content'
      }`}
    >
      {children}
    </Link>
  )
}
