import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { Badge, Card, Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { formatDate, hostnameOf } from '@/lib/utils'
import { listOfficialWebsites } from '@/modules/universities/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Official university websites',
  description:
    'Verified links to the official websites of the universities featured on UniSpace, for admissions, programmes and institutional information.',
  alternates: { canonical: '/universities/official-websites' },
}

export default async function OfficialWebsitesPage() {
  const universities = await listOfficialWebsites()

  return (
    <>
      <SiteHeader />

      <main id="main" className="py-12">
        <Container className="max-w-4xl">
          <SectionHeading
            eyebrow="Official sources"
            title="Official university websites"
            description="UniSpace covers campus life, not institutional information. For admissions, programmes, entry requirements, policies and official announcements, go to the university's own website."
            className="mb-8"
          />

          {universities.length === 0 ? (
            <EmptyState
              title="No universities published yet"
              description="Official links appear here once a university profile is published from the dashboard."
            />
          ) : (
            <ul className="space-y-4">
              {universities.map((university, index) => (
                <li key={university.id}>
                  <Card
                    className="us-stagger"
                    style={{ '--stagger': index } as React.CSSProperties}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-content">{university.name}</h2>
                        <Link
                          href={`/universities/${university.slug}`}
                          className="text-xs font-bold uppercase tracking-[0.14em] text-brand hover:underline"
                        >
                          {university.acronym} on UniSpace
                        </Link>
                      </div>
                      {university.officialWebsite ? (
                        university.officialWebsiteVerifiedAt ? (
                          <Badge tone="positive">
                            Confirmed {formatDate(university.officialWebsiteVerifiedAt)}
                          </Badge>
                        ) : (
                          <Badge tone="caution">Awaiting confirmation</Badge>
                        )
                      ) : null}
                    </div>

                    {university.officialWebsite ? (
                      <OfficialLink label="Official website" url={university.officialWebsite} />
                    ) : (
                      <p className="mt-3 text-sm text-content-muted">
                        No official website has been confirmed for this university yet. UniSpace
                        does not publish a link until an administrator has checked it.
                      </p>
                    )}

                    {university.links.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {university.links.map((link) => (
                          <li key={link.id}>
                            <OfficialLink label={link.label} url={link.url} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  )
}

function OfficialLink({ label, url }: { label: string; url: string }) {
  const host = hostnameOf(url)
  if (!host) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
    >
      {label} · {host}
      <ArrowUpRight aria-hidden className="h-4 w-4" />
    </a>
  )
}
