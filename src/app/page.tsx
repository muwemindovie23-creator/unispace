import {
  CalendarDays,
  Lightbulb,
  Footprints,
  Store,
  Users,
  Vote,
} from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'

import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { UniversityExplorer } from '@/components/site/university-explorer'
import { ButtonLink } from '@/components/ui/button'
import { Card, Container, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { listPublishedUniversities } from '@/modules/universities/queries'

export const metadata: Metadata = {
  title: 'Which university would you like to explore?',
  description:
    'Choose your campus on UniSpace and discover campus businesses, a virtual campus tour, events, student representatives, campus tips and polls.',
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
    icon: Footprints,
    title: 'Virtual campus tour',
    description:
      'Walk the campus before you arrive — the places students actually use, on a map.',
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
            <Image
              src="/hero-students.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[50%_42%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b2c5c]/80 via-[#0b2c5c]/65 to-[#0b2c5c]/85" />
          </div>

          <Container className="pb-20 pt-20 text-center sm:pb-28 sm:pt-32">

            <h1
              className="us-stagger mx-auto max-w-4xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl"
              style={{ '--stagger': 1 } as React.CSSProperties}
            >
              Which university would you like to explore?
            </h1>

            <p
              className="us-stagger mx-auto mt-5 max-w-2xl text-pretty text-base text-white/90 sm:text-lg"
              style={{ '--stagger': 2 } as React.CSSProperties}
            >
              UniSpace is the student side of campus: As a product in the Menty ecosystem, it's goal is to show you around campus from the view of those who've been there from what’s happening, who represents you, and the everyday things students wish they had known earlier.
            </p>

            <div
              className="us-stagger mt-8 flex flex-wrap items-center justify-center gap-3"
              style={{ '--stagger': 3 } as React.CSSProperties}
            >
              <ButtonLink href="#universities" variant="accent" size="lg">
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
                  Students look for food, printing and everyday services around campus. Apply
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
