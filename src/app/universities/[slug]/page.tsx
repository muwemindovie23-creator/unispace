import { ArrowUpRight, Building2, MapPin, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CampusSelector } from '@/components/site/campus-selector'
import { SiteFooter } from '@/components/site/site-footer'
import { ThemeScope } from '@/components/site/theme-scope'
import { UniversityHeader } from '@/components/site/university-header'
import { ButtonLink, ExternalButtonLink } from '@/components/ui/button'
import { Badge, Card, Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { formatDate, hostnameOf } from '@/lib/utils'
import {
  getPublishedUniversityBySlug,
  listPublishedUniversitySlugs,
} from '@/modules/universities/queries'
import {
  DEFAULT_SECTION_ORDER,
  HOMEPAGE_SECTIONS,
  isHomepageSectionKey,
  type HomepageSectionKey,
} from '@/modules/universities/sections'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await listPublishedUniversitySlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const university = await getPublishedUniversityBySlug(slug)
  if (!university) return { title: 'University not found' }

  return {
    title: `${university.name} campus life`,
    description:
      university.shortDescription ??
      `Events, societies, student representatives and campus tips for ${university.name} on UniSpace.`,
    alternates: { canonical: `/universities/${university.slug}` },
    openGraph: {
      title: `${university.name} on UniSpace`,
      description: university.shortDescription ?? undefined,
      images: university.coverImageUrl ? [university.coverImageUrl] : undefined,
    },
  }
}

export default async function UniversityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const university = await getPublishedUniversityBySlug(slug)
  if (!university) notFound()

  // Admin-chosen order where configured, otherwise the platform default.
  const configured = university.enabledSections
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
        {/* --------------------------------------------------- University hero */}
        <section className="relative overflow-hidden border-b border-hairline">
          {university.coverImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={university.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/85 to-canvas/40" />
            </>
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 12% 15%, var(--us-primary) 0%, transparent 45%), radial-gradient(circle at 88% 30%, var(--us-accent) 0%, transparent 42%)',
              }}
            />
          )}

          <Container className="relative py-14 sm:py-20">
            <CampusSelector
              universitySlug={university.slug}
              campuses={university.campuses}
              activeCampusSlug={null}
              className="mb-8"
            />

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="brand">{university.acronym}</Badge>
              {university.profileStatus !== 'COMPLETE' ? (
                <Badge tone="muted">
                  {university.profileStatus === 'IN_PROGRESS'
                    ? 'Profile being built'
                    : 'Coming soon'}
                </Badge>
              ) : null}
              {university.city ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-muted">
                  <MapPin aria-hidden className="h-3.5 w-3.5" />
                  {university.city}
                </span>
              ) : null}
            </div>

            <h1 className="us-stagger mt-4 max-w-3xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-content sm:text-5xl">
              {university.name}
            </h1>

            {university.shortDescription ? (
              <p
                className="us-stagger mt-4 max-w-2xl text-pretty text-base text-content-muted sm:text-lg"
                style={{ '--stagger': 1 } as React.CSSProperties}
              >
                {university.shortDescription}
              </p>
            ) : null}

            <div
              className="us-stagger mt-7 flex flex-wrap gap-3"
              style={{ '--stagger': 2 } as React.CSSProperties}
            >
              <ButtonLink href={`/universities/${university.slug}/events`}>
                See what’s on
              </ButtonLink>
              <ButtonLink href={`/universities/${university.slug}/src`} variant="outline">
                Know your SRC
              </ButtonLink>
            </div>
          </Container>
        </section>

        {university.longDescription ? (
          <section className="py-12">
            <Container>
              <Card className="max-w-3xl">
                <p className="whitespace-pre-line leading-relaxed text-content-muted">
                  {university.longDescription}
                </p>
              </Card>
            </Container>
          </section>
        ) : null}

        {/* ------------------------------------------------------- Campuses */}
        {university.campuses.length > 0 ? (
          <section className="py-12">
            <Container>
              <SectionHeading
                eyebrow="Campuses"
                title={
                  university.campuses.length === 1
                    ? 'This university’s campus'
                    : 'Choose a campus'
                }
                description="Some content is university-wide. Other content — like local food vendors — belongs to one campus."
                className="mb-6"
              />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {university.campuses.map((campus, index) => (
                  <li key={campus.id}>
                    <Card
                      as={Link}
                      href={`/universities/${university.slug}/campus/${campus.slug}`}
                      className="us-stagger block h-full transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-brand motion-reduce:hover:translate-y-0"
                      style={{ '--stagger': index } as React.CSSProperties}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-highlight text-brand">
                          <Building2 aria-hidden className="h-5 w-5" />
                        </span>
                        {campus.isPrimary ? <Badge tone="brand">Main campus</Badge> : null}
                      </div>
                      <h3 className="mt-3 text-base font-bold text-content">{campus.name}</h3>
                      {campus.kind ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-content-muted">
                          {campus.kind}
                        </p>
                      ) : null}
                      {campus.description ? (
                        <p className="mt-2 text-sm text-content-muted">{campus.description}</p>
                      ) : null}
                      {campus.city ? (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-content-muted">
                          <MapPin aria-hidden className="h-3.5 w-3.5" />
                          {campus.city}
                        </p>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        ) : null}

        {/* ------------------------------------------------ Content sections */}
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
                    title="Nothing published here yet"
                    description={`${university.acronym} administrators publish this section from the UniSpace dashboard. It appears here as soon as the first item is published.`}
                  />
                </Container>
              </section>
            )
          })}

        {/* ------------------------------------- Official university information */}
        <section className="py-12">
          <Container>
            <SectionHeading
              eyebrow="Official information"
              title="Official university information"
              description="UniSpace does not duplicate admissions, programmes or entry requirements. For those, go straight to the university’s own website."
              className="mb-6"
            />

            {university.officialWebsite || university.officialLinks.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {university.officialWebsite ? (
                  <li>
                    <OfficialLinkCard
                      label={`${university.acronym} official website`}
                      url={university.officialWebsite}
                      description="The university's own site — the authoritative source for institutional information."
                      verifiedAt={university.officialWebsiteVerifiedAt}
                    />
                  </li>
                ) : null}
                {university.officialLinks.map((link) => (
                  <li key={link.id}>
                    <OfficialLinkCard
                      label={link.label}
                      url={link.url}
                      description={link.description}
                      verifiedAt={link.verifiedAt}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Official links not confirmed yet"
                description="UniSpace only publishes an official link once an administrator has confirmed it resolves to the university's own page. None have been confirmed for this university so far."
              />
            )}
          </Container>
        </section>
      </main>

      <SiteFooter />
    </ThemeScope>
  )
}

function OfficialLinkCard({
  label,
  url,
  description,
  verifiedAt,
}: {
  label: string
  url: string
  description?: string | null
  verifiedAt?: Date | null
}) {
  const host = hostnameOf(url)
  if (!host) return null

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-content">{label}</h3>
        {verifiedAt ? (
          <Badge tone="positive">
            <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
            Confirmed {formatDate(verifiedAt)}
          </Badge>
        ) : (
          <Badge tone="caution">Not yet confirmed</Badge>
        )}
      </div>
      {description ? <p className="mt-2 text-sm text-content-muted">{description}</p> : null}
      <p className="mt-3 text-xs font-semibold text-content-muted">{host}</p>
      <ExternalButtonLink href={url} size="sm" className="mt-4 self-start">
        Visit official site
        <ArrowUpRight aria-hidden className="h-4 w-4" />
      </ExternalButtonLink>
    </Card>
  )
}
