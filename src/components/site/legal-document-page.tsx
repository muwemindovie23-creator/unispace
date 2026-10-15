import { AlertTriangle } from 'lucide-react'

import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { Card, Container, EmptyState } from '@/components/ui/primitives'
import { Markdown } from '@/lib/markdown'
import { getSetting, SETTING_KEYS } from '@/lib/settings'
import { formatDate } from '@/lib/utils'
import { getPublishedLegalDocument, type LegalKind } from '@/modules/legal/queries'

/**
 * Renders the currently published version of a legal document. Legal text is
 * data, edited and versioned from the dashboard — never a hard-coded page.
 */
export async function LegalDocumentPage({ kind }: { kind: LegalKind }) {
  const [document, reviewStatus] = await Promise.all([
    getPublishedLegalDocument(kind),
    getSetting(SETTING_KEYS.LEGAL_REVIEW_STATUS),
  ])

  return (
    <>
      <SiteHeader />

      <main id="main" className="py-12">
        <Container className="max-w-3xl">
          {document ? (
            <>
              <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-content sm:text-4xl">
                  {document.title}
                </h1>
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-content-muted">
                  <div className="flex gap-1.5">
                    <dt className="font-semibold text-content">Version</dt>
                    <dd>{document.version}</dd>
                  </div>
                  {document.effectiveAt ? (
                    <div className="flex gap-1.5">
                      <dt className="font-semibold text-content">Effective</dt>
                      <dd>{formatDate(document.effectiveAt)}</dd>
                    </div>
                  ) : null}
                  <div className="flex gap-1.5">
                    <dt className="font-semibold text-content">Last updated</dt>
                    <dd>{formatDate(document.lastUpdatedAt)}</dd>
                  </div>
                </dl>
              </header>

              {reviewStatus !== 'reviewed' ? (
                <Card className="mb-8 border-amber-300 bg-amber-50">
                  <div className="flex gap-3">
                    <AlertTriangle
                      aria-hidden
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                    />
                    <div>
                      <h2 className="text-sm font-bold text-amber-950">
                        Pending independent legal review
                      </h2>
                      <p className="mt-1 text-sm text-amber-900">
                        This document describes how UniSpace actually works today, but it has not
                        yet been reviewed by a qualified legal practitioner against Malawi’s data
                        protection and consumer laws. It is not legal advice. The notice is removed
                        from the dashboard once that review is complete.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : null}

              <article>
                <Markdown source={document.body} />
              </article>
            </>
          ) : (
            <EmptyState
              title="This document has not been published yet"
              description="A Super Admin publishes legal documents from the UniSpace dashboard. Until a version is published, nothing is shown here — rather than an out-of-date or placeholder policy."
            />
          )}
        </Container>
      </main>

      <SiteFooter />
    </>
  )
}
