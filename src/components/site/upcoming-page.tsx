import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { ButtonLink } from '@/components/ui/button'
import { Card, Container } from '@/components/ui/primitives'
import { getSetting, type SettingKey } from '@/lib/settings'

/**
 * Honest placeholder for a feature whose milestone has not landed yet.
 *
 * The footer and navigation are built in Milestone 1, so these routes must
 * resolve to something truthful rather than a 404 or an invented form.
 */
export async function UpcomingPage({
  title,
  summary,
  milestone,
  contactSettingKey,
  points,
}: {
  title: string
  summary: string
  milestone: string
  contactSettingKey?: SettingKey
  points?: string[]
}) {
  const contactEmail = contactSettingKey ? await getSetting(contactSettingKey) : null

  return (
    <>
      <SiteHeader />

      <main id="main" className="py-16">
        <Container className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand">
            {milestone}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-content sm:text-4xl">{title}</h1>
          <p className="mt-4 text-content-muted">{summary}</p>

          {points && points.length > 0 ? (
            <Card className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-content">
                What this page will do
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-content-muted">
                {points.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="mt-4 bg-surface-muted/70">
            <h2 className="text-sm font-bold text-content">In the meantime</h2>
            <p className="mt-1.5 text-sm text-content-muted">
              {contactEmail ? (
                <>
                  You can reach us at{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="font-semibold text-brand underline underline-offset-2"
                  >
                    {contactEmail}
                  </a>
                  .
                </>
              ) : (
                <>
                  A contact address has not been configured yet. A Super Admin sets it in the
                  UniSpace dashboard under platform settings, and it then appears here
                  automatically.
                </>
              )}
            </p>
          </Card>

          <ButtonLink href="/" variant="outline" className="mt-8">
            Back to universities
          </ButtonLink>
        </Container>
      </main>

      <SiteFooter />
    </>
  )
}
