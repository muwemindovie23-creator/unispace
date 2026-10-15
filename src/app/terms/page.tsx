import type { Metadata } from 'next'

import { LegalDocumentPage } from '@/components/site/legal-document-page'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The rules that govern access to and use of UniSpace.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <LegalDocumentPage kind="TERMS_OF_USE" />
}
