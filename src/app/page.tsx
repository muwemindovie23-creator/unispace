import {
  CalendarDays,
  Lightbulb,
  Megaphone,
  Store,
  Users,
  Vote,
} from 'lucide-react'
import type { Metadata } from 'next'

import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { UniversityExplorer } from '@/components/site/university-explorer'
import { ButtonLink } from '@/components/ui/button'
import { Card, Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { listPublishedUniversities } from '@/modules/universities/queries'

export const metadata: Metadata = {
  title: 'Which university would you like to explore?',
  description:
    'Choose your campus on UniSpace and discover events, societies, student representatives, campus tips, polls and student-focused businesses.',
}

// Universities and their themes change rarely; revalidate rather than hitting
// the database on every request.
export const revalidate = 300

const EXPERIENCE_PREVIEW = [
  {
    icon: CalendarDays,
    title: 'Campus life & events',
    description:
      'Open airs, freshers’ events, sports, cultural festivals and student meetups — in one place.',
  },
  {
    icon: Users,
    title: 'Know your SRC',
    description:
      'Who represents you, what their portfolio covers and which office to contact.',
  },
  {
    icon: Megaphone,
    title: 'Societies & communities',
    description:
      'Find the clubs, teams and student communities you actually want to join.',
  },
  {
    icon: Lightbulb,
    title: 'Did you know?',
    description:
      'The practical things students usually learn late — labelled honestly by how well they are checked.',
  },
  {
    icon: Vote,
    title: 'Campus polls',
    description:
      'Informal polls on campus topics. No account needed to take part.',
  },
  {
    icon: Store,
    title: 'Campus businesses',
    description:
      'Food, printing, barbers, laundry and the everyday services around your campus.',
  },
]

export default async function HomePage() {
  const universities = await listPublishedUniversities()

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* ------------------------------------------------------------- Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl animate-[float_9s_ease-in-out_infinite]" />
            <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-[float_11s_ease-in-out_infinite_reverse]" />
          </div>

          <Container className="pb-12 pt-16 text-center sm:pt-24">
            <p className="us-stagger mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand">
              One platform · different campus worlds
            </p>

            <h1
              className="us-stagger mx-auto max-w-4xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-content sm:text-6xl"
              style={{ '--stagger': 1 } as React.CSSProperties}
            >
              Which university would you like to explore?
            </h1>

            <p
              className="us-stagger mx-auto mt-5 max-w-2xl text-pretty text-base text-content-muted sm:text-lg"
              style={{ '--stagger': 2 } as React.CSSProperties}
            >
              UniSpace is the student side of campus: what’s happening, who represents you, which
              societies exist, and the everyday things students wish they had known earlier.
            </p>

            <div
              className="us-stagger mt-8 flex flex-wrap items-center justify-center gap-3"
              style={{ '--stagger': 3 } as React.CSSProperties}
            >
              <ButtonLink href="#universities" size="lg">
                Choose your campus
              </ButtonLink>
              <ButtonLink href="/businesses/verify" variant="outline" size="lg">
                List your campus business
              </ButtonLink>
            </div>
          </Container>
        </section>

        {/* ----------------------------------------------- University picker */}
        <section id="universities" className="scroll-mt-20 py-10">
          <Container>
            <SectionHeading
              eyebrow="Pick your campus"
              title="Universities on UniSpace"
              description="Each university has its own look, its own campuses and its own student-life content. Browsing is open to everyone — no account needed."
              className="mb-8"
            />

            {universities.length === 0 ? (
              <EmptyState
                title="No universities published yet"
                description="University profiles are added from the UniSpace dashboard. Once a profile is published it appears here automatically."
              />
            ) : (
              <UniversityExplorer universities={universities} />
            )}
          </Container>
        </section>

        {/* -------------------------------------------- Experience preview */}
        <section className="py-16">
          <Container>
            <SectionHeading
              eyebrow="What you’ll find inside"
              title="The parts of campus life that official websites don’t cover"
              description="For admissions, programmes and entry requirements, UniSpace links you straight to the university’s own website. Everything here is about the lived side of campus."
              className="mb-8"
            />

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EXPERIENCE_PREVIEW.map((item, index) => (
                <li key={item.title}>
                  <Card
                    className="us-stagger h-full transition-colors duration-300 hover:border-brand"
                    style={{ '--stagger': index } as React.CSSProperties}
                  >
                    <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-highlight text-brand">
                      <item.icon aria-hidden className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-bold text-content">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-content-muted">{item.description}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* ----------------------------------------------------- Partner CTA */}
        <section className="pb-8">
          <Container>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-highlight/70">
                <h3 className="text-xl font-extrabold tracking-tight text-content">
                  Become a Verified Campus Business
                </h3>
                <p className="mt-2 text-sm text-content-muted">
                  Students look for food, printing, laundry and everyday services around campus. Apply
                  to be listed, and see exactly what our verification badge does and does not mean.
                </p>
                <ButtonLink href="/businesses/verify" className="mt-5">
                  See how verification works
                </ButtonLink>
              </Card>

              <Card>
                <h3 className="text-xl font-extrabold tracking-tight text-content">
                  Advertise With Us
                </h3>
                <p className="mt-2 text-sm text-content-muted">
                  Reach students at a specific university or campus. Paid placements are always
                  labelled, and advertising never affects verification or poll results.
                </p>
                <ButtonLink href="/advertise" variant="outline" className="mt-5">
                  Talk to us about advertising
                </ButtonLink>
              </Card>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
