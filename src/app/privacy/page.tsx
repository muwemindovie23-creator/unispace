import type { Metadata } from 'next'

import { LegalDocumentPage } from '@/components/site/legal-document-page'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How UniSpace collects, uses, shares and retains information, and the choices available to you.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <LegalDocumentPage kind="PRIVACY_POLICY" />
}
