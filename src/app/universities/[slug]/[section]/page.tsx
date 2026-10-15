import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { SiteFooter } from '@/components/site/site-footer'
import { ThemeScope } from '@/components/site/theme-scope'
import { UniversityHeader } from '@/components/site/university-header'
import { ButtonLink } from '@/components/ui/button'
import { Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { getPublishedUniversityBySlug } from '@/modules/universities/queries'
import { HOMEPAGE_SECTIONS, isHomepageSectionKey } from '@/modules/universities/sections'

/**
 * Section landing pages.
 *
 * The routes and navigation exist from Milestone 1 so a university's structure
 * is real and linkable. Each section is replaced by its own module as that
 * milestone lands (events and SRC in Milestone 3, polls in 4, businesses in 5).
 * Until then the page says so plainly rather than showing invented content.
 */

const SECTION_BY_HREF = Object.fromEntries(
  Object.values(HOMEPAGE_SECTIONS)
    .filter((section) => section.href !== null)
    .map((section) => [section.href as string, section]),
)

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; section: string }>
}): Promise<Metadata> {
  const { slug, section } = await params
  const config = SECTION_BY_HREF[section]
  const university = await getPublishedUniversityBySlug(slug)
  if (!config || !university) return { title: 'Page not found' }

  return {
    title: `${config.label} · ${university.acronym}`,
    description: config.description,
    alternates: { canonical: `/universities/${slug}/${section}` },
  }
}

export default async function UniversitySectionPage({
  params,
}: {
  params: Promise<{ slug: string; section: string }>
}) {
  const { slug, section } = await params
  const config = SECTION_BY_HREF[section]
  if (!config || !isHomepageSectionKey(config.key)) notFound()

  const university = await getPublishedUniversityBySlug(slug)
  if (!university) notFound()

  return (
    <ThemeScope theme={university.theme} className="min-h-dvh">
      <UniversityHeader
        name={university.name}
        acronym={university.acronym}
        slug={university.slug}
        logoUrl={university.logoUrl}
      />

      <main id="main" className="py-12">
        <Container>
          <SectionHeading
            eyebrow={university.acronym}
            title={config.label}
            description={config.description}
            className="mb-8"
          />

          <EmptyState
            title="Nothing published here yet"
            description={`Administrators for ${university.name} publish this section from the UniSpace dashboard. Published items appear here automatically — UniSpace never fills a section with placeholder content.`}
            action={
              <ButtonLink href={`/universities/${university.slug}`} variant="outline" size="sm">
                Back to {university.acronym}
              </ButtonLink>
            }
          />
        </Container>
      </main>

      <SiteFooter />
    </ThemeScope>
  )
}
