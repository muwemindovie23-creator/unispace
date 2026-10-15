import type { Metadata } from 'next'

import { UpcomingPage } from '@/components/site/upcoming-page'
import { SETTING_KEYS } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'How UniSpace approaches accessibility, and how to tell us when something does not work.',
  alternates: { canonical: '/accessibility' },
}

export default function AccessibilityPage() {
  return (
    <UpcomingPage
      milestone="Statement published in Milestone 8"
      title="Accessibility"
      summary="UniSpace is built to be keyboard navigable, screen-reader friendly and usable with animation switched off. A full statement is published once the platform has been audited end to end."
      contactSettingKey={SETTING_KEYS.CONTACT_GENERAL_EMAIL}
      points={[
        'Every interactive element is reachable by keyboard with a visible focus ring.',
        'Animation respects your operating system’s reduced-motion setting.',
        'University themes are checked for colour contrast before they can be published.',
      ]}
    />
  )
}
