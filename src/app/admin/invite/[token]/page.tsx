import type { Metadata } from 'next'
import Link from 'next/link'

import { AcceptInviteForm } from '@/components/admin/auth-forms'
import { Card, Container } from '@/components/ui/primitives'
import { findUsableInvite } from '@/modules/admin/invites'

export const metadata: Metadata = {
  title: 'Accept your invitation',
  robots: { index: false, follow: false },
}

// The token is in the URL, so this page is never cached or prerendered.
export const dynamic = 'force-dynamic'

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await findUsableInvite(token)

  return (
    <main id="main" className="grid min-h-dvh place-items-center py-12">
      <Container className="max-w-md">
        <Card>
          {invite ? (
            <>
              <h1 className="text-xl font-extrabold tracking-tight text-content">
                Welcome, {invite.adminUser.name}
              </h1>
              <p className="mt-1.5 mb-6 text-sm text-content-muted">
                Choose a password for <strong>{invite.adminUser.email}</strong>. This link works
                once and then stops working.
              </p>
              <AcceptInviteForm token={token} />
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold tracking-tight text-content">
                This invitation is no longer valid
              </h1>
              <p className="mt-2 text-sm text-content-muted">
                Invitation links expire after 48 hours and can only be used once. Ask a Super Admin
                to send you a new one.
              </p>
              <Link
                href="/admin/login"
                className="mt-6 inline-block text-sm font-semibold text-brand hover:underline"
              >
                Go to sign in
              </Link>
            </>
          )}
        </Card>
      </Container>
    </main>
  )
}
