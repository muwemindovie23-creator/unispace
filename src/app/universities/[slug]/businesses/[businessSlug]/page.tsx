import { BadgeCheck, Mail, MapPin, Megaphone, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MapEmbed } from '@/components/site/map-embed'
import { ReportBusinessForm } from '@/components/site/report-business-form'
import { SiteFooter } from '@/components/site/site-footer'
import { ThemeScope } from '@/components/site/theme-scope'
import { UniversityHeader } from '@/components/site/university-header'
import { ButtonLink } from '@/components/ui/button'
import { Badge, Card, Container, SectionHeading } from '@/components/ui/primitives'
import { formatDate } from '@/lib/utils'
import {
  getPublishedBusiness,
  listPublishedBusinessPaths,
} from '@/modules/businesses/queries'
import { getPublishedUniversityBySlug } from '@/modules/universities/queries'

export const revalidate = 300

export async function generateStaticParams() {
  const paths = await listPublishedBusinessPaths()
  return paths.map((path) => ({ slug: path.universitySlug, businessSlug: path.businessSlug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; businessSlug: string }>
}): Promise<Metadata> {
  const { slug, businessSlug } = await params
  const business = await getPublishedBusiness(slug, businessSlug)
  if (!business) return { title: 'Business not found' }

  return {
    title: `${business.name} · ${business.universityAcronym}`,
    description: business.description.slice(0, 160),
    alternates: { canonical: `/universities/${slug}/businesses/${businessSlug}` },
  }
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ slug: string; businessSlug: string }>
}) {
  const { slug, businessSlug } = await params

  const [business, university] = await Promise.all([
    getPublishedBusiness(slug, businessSlug),
    getPublishedUniversityBySlug(slug),
  ])
  if (!business || !university) notFound()

  return (
    <ThemeScope theme={university.theme} className="min-h-dvh">
      <UniversityHeader
        name={university.name}
        acronym={university.acronym}
        slug={university.slug}
        logoUrl={university.logoUrl}
      />

      <main id="main" className="py-10">
        <Container className="max-w-4xl">
          <ButtonLink
            href={`/universities/${slug}/businesses`}
            variant="ghost"
            size="sm"
            className="mb-5 -ml-3"
          >
            ← All campus businesses
          </ButtonLink>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {business.categoryLabel ? (
                <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
                  {business.categoryLabel}
                </p>
              ) : null}
              <h1 className="text-3xl font-black tracking-tight text-content sm:text-4xl">
                {business.name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {business.isSponsored ? (
                <Badge tone="accent">
                  <Megaphone aria-hidden className="h-3.5 w-3.5" />
                  Sponsored
                </Badge>
              ) : null}
              {business.verificationStatus === 'VERIFIED' ? (
                <Badge tone="positive">
                  <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              ) : (
                <Badge tone="muted">Not verified</Badge>
              )}
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line leading-relaxed text-content-muted">
            {business.description}
          </p>

          {business.services ? (
            <Card className="mt-6">
              <h2 className="text-sm font-bold text-content">Services</h2>
              <p className="mt-1.5 whitespace-pre-line text-sm text-content-muted">
                {business.services}
              </p>
            </Card>
          ) : null}

          {/* ------------------------------------------------- Practicalities */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="text-sm font-bold text-content">Finding it</h2>
              <dl className="mt-3 space-y-2 text-sm text-content-muted">
                {business.campusName ? (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-content">Campus</dt>
                    <dd>{business.campusName}</dd>
                  </div>
                ) : null}
                {business.locationNote ? (
                  <div className="flex items-start gap-2">
                    <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                    <dd>{business.locationNote}</dd>
                  </div>
                ) : null}
                {business.priceRange ? (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-content">Prices</dt>
                    <dd>{business.priceRange}</dd>
                  </div>
                ) : null}
              </dl>
              {!business.campusName && !business.locationNote && !business.priceRange ? (
                <p className="mt-2 text-sm text-content-muted">
                  No location details have been confirmed for this listing yet.
                </p>
              ) : null}
            </Card>

            <Card>
              <h2 className="text-sm font-bold text-content">Getting in touch</h2>
              {business.publicPhone || business.publicEmail ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {business.publicPhone ? (
                    <li className="flex items-center gap-2">
                      <Phone aria-hidden className="h-4 w-4 text-content-muted" />
                      <a
                        href={`tel:${business.publicPhone.replace(/\s+/g, '')}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        {business.publicPhone}
                      </a>
                    </li>
                  ) : null}
                  {business.publicEmail ? (
                    <li className="flex items-center gap-2">
                      <Mail aria-hidden className="h-4 w-4 text-content-muted" />
                      <a
                        href={`mailto:${business.publicEmail}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        {business.publicEmail}
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-content-muted">
                  No contact details have been published for this business.
                </p>
              )}
              <p className="mt-4 text-xs text-content-muted">
                Confirm opening hours and prices with the business before you travel — they change.
              </p>
            </Card>
          </div>

          {/* -------------------------------------------------------- Map */}
          {business.showOnMap ? (
            <section className="mt-8">
              <SectionHeading title="On the map" className="mb-4" />
              <MapEmbed
                source={{
                  mapEmbedUrl: business.mapEmbedUrl,
                  latitude: business.latitude,
                  longitude: business.longitude,
                  placeQuery: business.locationNote
                    ? `${business.name}, ${business.locationNote}`
                    : null,
                }}
                title={business.name}
              />
            </section>
          ) : null}

          {/* ------------------------------------------- Verification meaning */}
          <Card className="mt-8 bg-surface-muted/70">
            <h2 className="text-sm font-bold text-content">About this listing</h2>
            {business.verificationStatus === 'VERIFIED' ? (
              <>
                <p className="mt-1.5 text-sm text-content-muted">
                  UniSpace verified this listing
                  {business.lastVerifiedAt ? ` on ${formatDate(business.lastVerifiedAt)}` : ''}.
                  {business.lastVerificationChecks
                    ? ` What we checked: ${business.lastVerificationChecks}`
                    : ''}
                </p>
                {business.verificationExpiresAt ? (
                  <p className="mt-1.5 text-xs text-content-muted">
                    Due for re-checking by {formatDate(business.verificationExpiresAt)}.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-1.5 text-sm text-content-muted">
                This listing has not been verified by UniSpace.
              </p>
            )}
            <p className="mt-2 text-sm text-content-muted">
              Verification does not mean a business is licensed, safe, good value or endorsed by{' '}
              {business.universityAcronym}. It is a check of identity and contact details on a
              date.
            </p>
          </Card>

          {/* ------------------------------------------------------- Report */}
          <section className="mt-8">
            <SectionHeading
              title="Something wrong with this listing?"
              description="Closed down, wrong number, wrong place? Tell us and a person will check. Reporting never deletes a listing automatically."
              className="mb-4"
            />
            <ReportBusinessForm businessId={business.id} businessName={business.name} />
          </section>
        </Container>
      </main>

      <SiteFooter />
    </ThemeScope>
  )
}
