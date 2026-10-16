import type { Metadata } from 'next'

import { AdvertisingEnquiryForm } from '@/components/site/advertising-enquiry-form'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { Card, Container, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Advertise With Us',
  description:
    'Reach students at a specific university or campus through clearly labelled placements on UniSpace.',
  alternates: { canonical: '/advertise' },
}

export const dynamic = 'force-dynamic'

export default async function AdvertisePage() {
  const [universities, placements] = await Promise.all([
    db.university.findMany({
      where: { isPublished: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, acronym: true },
    }),
    db.advertisingPlacement.findMany({
      where: { isAvailable: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true, description: true },
    }),
  ])

  return (
    <>
      <SiteHeader />

      <main id="main" className="py-12">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="For advertisers"
            title="Advertise With Us"
            description="UniSpace reaches students at specific universities and campuses. Tell us what you want to achieve and we will tell you honestly whether we can help."
            className="mb-8"
          />

          <Card className="mb-6 bg-highlight/60">
            <h2 className="text-sm font-bold text-content">How we handle advertising</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-content-muted">
              <li>Every paid placement is labelled “Sponsored”. Nothing is quietly promoted.</li>
              <li>
                Paying never changes a business verification decision, and never affects a poll
                result. Those are separate processes.
              </li>
              <li>
                We will not publish advertising that is misleading, unlawful or discriminatory, and
                we can remove a campaign that breaches our policy.
              </li>
              <li>
                We do not publish audience or reach figures we cannot stand behind. Ask us and we
                will tell you what we actually have.
              </li>
            </ul>
          </Card>

          {placements.length > 0 ? (
            <Card className="mb-8">
              <h2 className="text-sm font-bold text-content">Available placements</h2>
              <ul className="mt-3 space-y-3">
                {placements.map((placement) => (
                  <li key={placement.id} className="border-t border-hairline pt-3 first:border-0 first:pt-0">
                    <h3 className="text-sm font-bold text-content">{placement.name}</h3>
                    {placement.description ? (
                      <p className="mt-0.5 text-sm text-content-muted">{placement.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card className="mb-8">
              <h2 className="text-sm font-bold text-content">Placements</h2>
              <p className="mt-1.5 text-sm text-content-muted">
                No placements are on sale yet. We would still like to hear what you have in mind —
                send an enquiry and we will come back to you when something fits.
              </p>
            </Card>
          )}

          <AdvertisingEnquiryForm universities={universities} placements={placements} />
        </Container>
      </main>

      <SiteFooter />
    </>
  )
}
