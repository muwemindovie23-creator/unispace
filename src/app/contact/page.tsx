import type { Metadata } from 'next'

import { UpcomingPage } from '@/components/site/upcoming-page'
import { SETTING_KEYS } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Contact UniSpace',
  description: 'Get in touch with UniSpace about campus information, listings, privacy or advertising.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <UpcomingPage
      milestone="Arriving in Milestone 7"
      title="Contact UniSpace"
      summary="A routed contact form is part of the moderation and administration milestone, so enquiries reach the right administrator rather than a shared inbox."
      contactSettingKey={SETTING_KEYS.CONTACT_GENERAL_EMAIL}
      points={[
        'Route each enquiry by category to the administrators responsible for it.',
        'Collect only a name, an address to reply to, and the message itself.',
        'Apply rate limiting and spam protection, with a clear confirmation.',
      ]}
    />
  )
}
