import { Footprints, Store } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BusinessCard } from '@/components/site/business-card'
import { CampusSelector } from '@/components/site/campus-selector'
import { MapEmbed } from '@/components/site/map-embed'
import { SiteFooter } from '@/components/site/site-footer'
import { ThemeScope } from '@/components/site/theme-scope'
import { UniversityHeader } from '@/components/site/university-header'
import { ButtonLink } from '@/components/ui/button'
import { Badge, Card, Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { formatDate } from '@/lib/utils'
import { listMappableBusinesses } from '@/modules/businesses/queries'
import { listPublishedTourStops } from '@/modules/tour'
import { getPublishedUniversityBySlug } from '@/modules/universities/queries'

export const revalidate = 300

const EVIDENCE_LABEL: Record<string, { label: string; tone: 'muted' | 'positive' | 'caution' }> = {
  UNVERIFIED: { label: 'Not yet checked', tone: 'muted' },
  STUDENT_REPORTED: { label: 'Student tip', tone: 'caution' },
  STAFF_CHECKED: { label: 'Checked by UniSpace', tone: 'positive' },
  OFFICIAL_SOURCE: { label: 'From an official source', tone: 'positive' },
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
    title: `Virtual campus tour · ${university.acronym}`,
    description: `Walk ${university.name} before you arrive — the places students actually use, on a map.`,
    alternates: { canonical: `/universities/${slug}/tour` },
  }
}

export default async function TourPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ campus?: string }>
}) {
  const { slug } = await params
  const { campus } = await searchParams

  const university = await getPublishedUniversityBySlug(slug)
  if (!university) notFound()

  const [stops, mappedBusinesses] = await Promise.all([
    listPublishedTourStops(slug, campus ?? null),
    listMappableBusinesses(slug, campus ?? null),
  ])

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
            title="Virtual campus tour"
            description="The places students actually use, in the order you would walk them. Maps come from Google — UniSpace only publishes a location once someone has confirmed it."
            className="mb-8"
          />

          {stops.length === 0 ? (
            <EmptyState
              icon={<Footprints className="h-6 w-6" />}
              title="The tour is still being built"
              description={`${university.acronym} administrators add tour stops from the dashboard. Each stop needs a confirmed map before it can be published, so this page stays empty rather than showing guessed locations.`}
            />
          ) : (
            <ol className="space-y-8">
              {stops.map((stop, index) => {
                const evidence = EVIDENCE_LABEL[stop.evidenceLevel] ?? EVIDENCE_LABEL.UNVERIFIED

                return (
                  <li key={stop.id}>
                    <Card
                      className="us-stagger overflow-hidden p-0"
                      style={{ '--stagger': Math.min(index, 6) } as React.CSSProperties}
                    >
                      <div className="grid gap-0 lg:grid-cols-2">
                        <div className="p-6">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-black text-brand-contrast">
                              {index + 1}
                            </span>
                            {stop.campusName ? (
                              <Badge tone="brand">{stop.campusName}</Badge>
                            ) : (
                              <Badge tone="muted">University-wide</Badge>
                            )}
                            <Badge tone={evidence.tone}>{evidence.label}</Badge>
                          </div>

                          <h2 className="text-xl font-extrabold tracking-tight text-content">
                            {stop.title}
                          </h2>

                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-content-muted">
                            {stop.description}
                          </p>

                          {stop.practicalNote ? (
                            <div className="mt-4 rounded-theme bg-highlight/70 p-3.5">
                              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-brand">
                                Worth knowing
                              </h3>
                              <p className="mt-1 text-sm text-content">{stop.practicalNote}</p>
                            </div>
                          ) : null}

                          {stop.lastCheckedAt ? (
                            <p className="mt-4 text-xs text-content-muted">
                              Last checked {formatDate(stop.lastCheckedAt)}
                            </p>
                          ) : null}
                        </div>

                        <div className="border-t border-hairline lg:border-l lg:border-t-0">
                          <MapEmbed
                            source={stop}
                            title={stop.title}
                            heightClass="h-full min-h-[18rem]"
                            className="h-full rounded-none border-0"
                          />
                        </div>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ol>
          )}

          {/* -------------------------------------- Businesses on the map */}
          <section className="mt-16">
            <SectionHeading
              eyebrow="Around campus"
              title="Campus businesses on the map"
              description="Listed businesses with a confirmed location. Sponsored listings are labelled, and sponsorship never affects verification."
              className="mb-6"
              action={
                <ButtonLink
                  href={`/universities/${slug}/businesses`}
                  variant="outline"
                  size="sm"
                >
                  All businesses
                </ButtonLink>
              }
            />

            {mappedBusinesses.length === 0 ? (
              <EmptyState
                icon={<Store className="h-6 w-6" />}
                title="No businesses with a confirmed location yet"
                description="A listing appears here once an administrator has recorded where it actually is. UniSpace never guesses coordinates."
                action={
                  <ButtonLink href="/businesses/verify" size="sm">
                    List your business
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mappedBusinesses.map((business, index) => (
                  <li key={business.id}>
                    <BusinessCard
                      business={business}
                      universitySlug={university.slug}
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Container>
      </main>

      <SiteFooter />
    </ThemeScope>
  )
}
