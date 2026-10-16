import { MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CampusSelector } from '@/components/site/campus-selector'
import { SiteFooter } from '@/components/site/site-footer'
import { ThemeScope } from '@/components/site/theme-scope'
import { UniversityHeader } from '@/components/site/university-header'
import { ButtonLink } from '@/components/ui/button'
import { Badge, Card, Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import {
  getPublishedCampusBySlug,
  listPublishedCampusPaths,
} from '@/modules/universities/queries'
import {
  DEFAULT_SECTION_ORDER,
  HOMEPAGE_SECTIONS,
  isHomepageSectionKey,
  type HomepageSectionKey,
} from '@/modules/universities/sections'

export const revalidate = 300

export async function generateStaticParams() {
  const paths = await listPublishedCampusPaths()
  return paths.map((path) => ({ slug: path.universitySlug, campusSlug: path.campusSlug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; campusSlug: string }>
}): Promise<Metadata> {
  const { slug, campusSlug } = await params
  const campus = await getPublishedCampusBySlug(slug, campusSlug)
  if (!campus) return { title: 'Campus not found' }

  return {
    title: `${campus.name} — ${campus.university.acronym} campus life`,
    description:
      campus.description ??
      `Campus businesses, events, student representatives and campus tips for ${campus.name}.`,
    alternates: { canonical: `/universities/${slug}/campus/${campusSlug}` },
  }
}

export default async function CampusPage({
  params,
}: {
  params: Promise<{ slug: string; campusSlug: string }>
}) {
  const { slug, campusSlug } = await params
  const campus = await getPublishedCampusBySlug(slug, campusSlug)
  if (!campus) notFound()

  const university = campus.university

  const configured = campus.enabledSections
    .map((section) => section.sectionKey)
    .filter(isHomepageSectionKey)
  const sectionKeys: HomepageSectionKey[] =
    configured.length > 0 ? configured : DEFAULT_SECTION_ORDER

  return (
    <ThemeScope theme={university.theme} className="min-h-dvh">
      <UniversityHeader
        name={university.name}
        acronym={university.acronym}
        slug={university.slug}
        logoUrl={university.logoUrl}
      />

      <main id="main">
        <section className="relative overflow-hidden border-b border-hairline">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 15% 20%, var(--us-primary) 0%, transparent 45%), radial-gradient(circle at 85% 35%, var(--us-accent) 0%, transparent 42%)',
            }}
          />

          <Container className="relative py-12 sm:py-16">
            <CampusSelector
              universitySlug={university.slug}
              campuses={university.campuses}
              activeCampusSlug={campus.slug}
              className="mb-8"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand">{university.acronym}</Badge>
              {campus.isPrimary ? <Badge tone="muted">Main campus</Badge> : null}
              {campus.profileStatus !== 'COMPLETE' ? (
                <Badge tone="muted">
                  {campus.profileStatus === 'IN_PROGRESS'
                    ? 'Profile being built'
                    : 'Coming soon'}
                </Badge>
              ) : null}
              {campus.city ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-muted">
                  <MapPin aria-hidden className="h-3.5 w-3.5" />
                  {campus.city}
                </span>
              ) : null}
            </div>

            <h1 className="us-stagger mt-4 max-w-3xl text-balance text-3xl font-black leading-[1.08] tracking-tight text-content sm:text-5xl">
              {campus.name}
            </h1>

            {campus.kind ? (
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-brand">
                {campus.kind}
              </p>
            ) : null}

            {campus.description ? (
              <p
                className="us-stagger mt-4 max-w-2xl text-pretty text-content-muted"
                style={{ '--stagger': 1 } as React.CSSProperties}
              >
                {campus.description}
              </p>
            ) : null}

            <ButtonLink
              href={`/universities/${university.slug}`}
              variant="outline"
              size="sm"
              className="us-stagger mt-7"
              style={{ '--stagger': 2 } as React.CSSProperties}
            >
              See all of {university.acronym}
            </ButtonLink>
          </Container>
        </section>

        {sectionKeys
          .filter((key) => key !== 'official')
          .map((key) => {
            const section = HOMEPAGE_SECTIONS[key]
            return (
              <section key={key} className="py-8">
                <Container>
                  <SectionHeading
                    title={section.label}
                    description={section.description}
                    className="mb-5"
                  />
                  <EmptyState
                    title={`Nothing published for ${campus.name} yet`}
                    description="Content scoped to this campus appears here once it is published from the dashboard. University-wide items are shown on the main university page."
                  />
                </Container>
              </section>
            )
          })}

        <section className="py-12">
          <Container>
            <Card className="bg-highlight/60">
              <h2 className="text-base font-bold text-content">Looking for official information?</h2>
              <p className="mt-1.5 text-sm text-content-muted">
                UniSpace covers campus life. For admissions, programmes and institutional
                announcements, use {university.acronym}’s own website.
              </p>
              <ButtonLink
                href={`/universities/${university.slug}`}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Official links for {university.acronym}
              </ButtonLink>
            </Card>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </ThemeScope>
  )
}
