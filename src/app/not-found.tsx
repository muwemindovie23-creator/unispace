import type { Metadata } from 'next'

import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/primitives'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="py-24">
        <Container className="max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">404</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-content sm:text-4xl">
            We could not find that page
          </h1>
          <p className="mt-4 text-content-muted">
            The link may be out of date, or the university profile may not be published yet.
          </p>
          <ButtonLink href="/" className="mt-8">
            Choose a university
          </ButtonLink>
        </Container>
      </main>
      <SiteFooter />
    </>
  )
}
