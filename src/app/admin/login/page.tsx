import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/admin/auth-forms'
import { Card, Container } from '@/components/ui/primitives'
import { getActor } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Administrator sign in',
  // Administrator pages must never appear in search results.
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  if (await getActor()) redirect('/admin')

  return (
    <main id="main" className="grid min-h-dvh place-items-center py-12">
      <Container className="max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-black text-brand-contrast"
          >
            US
          </span>
          <span className="text-base font-extrabold tracking-tight text-content">UniSpace</span>
        </Link>

        <Card>
          <h1 className="text-xl font-extrabold tracking-tight text-content">
            Administrator sign in
          </h1>
          <p className="mt-1.5 mb-6 text-sm text-content-muted">
            UniSpace administrator accounts are created by invitation. There is no public sign-up.
          </p>

          <SignInForm />
        </Card>

        <p className="mt-6 text-center text-xs text-content-muted">
          Browsing UniSpace does not need an account.{' '}
          <Link href="/" className="font-semibold text-brand hover:underline">
            Back to universities
          </Link>
        </p>
      </Container>
    </main>
  )
}
