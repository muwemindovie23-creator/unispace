import { BadgeCheck } from 'lucide-react'
import type { Metadata } from 'next'

import { BusinessApplicationForm } from '@/components/site/business-application-form'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { Card, Container, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Become a Verified Campus Business',
  description:
    'Apply to list your business on UniSpace, and see exactly what our verification badge does and does not mean.',
  alternates: { canonical: '/businesses/verify' },
}

// The form posts a server action and reads live university data.
export const dynamic = 'force-dynamic'

export default async function BusinessVerificationPage() {
  const universities = await db.university.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      acronym: true,
      campuses: {
        where: { isPublished: true },
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true },
      },
    },
  })

  return (
    <>
      <SiteHeader />

      <main id="main" className="py-12">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="For businesses"
            title="Become a Verified Campus Business on UniSpace"
            description="Students look for food, printing, laundry, barbers and everyday services around campus. Listing puts your business where they are already looking."
            className="mb-8"
          />

          <Card className="mb-8 bg-highlight/60">
            <div className="flex gap-3">
              <BadgeCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <h2 className="text-sm font-bold text-content">What verification means</h2>
                <p className="mt-1.5 text-sm text-content-muted">
                  We check that the business is real, that you are authorised to represent it, and
                  that the contact details are correct on the date we check. The badge records
                  exactly that, with the date.
                </p>
                <h3 className="mt-3 text-sm font-bold text-content">What it does not mean</h3>
                <p className="mt-1.5 text-sm text-content-muted">
                  It is not a quality rating, a safety or licensing check, a guarantee that you are
                  trading, or an endorsement by any university. Badges lapse and must be renewed,
                  and we may withdraw one if a listing becomes inaccurate.
                </p>
              </div>
            </div>
          </Card>

          {universities.length === 0 ? (
            <Card>
              <p className="text-sm text-content-muted">
                No universities are published yet, so applications are not open. Please check back.
              </p>
            </Card>
          ) : (
            <BusinessApplicationForm universities={universities} />
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  )
}
