import type { Metadata } from 'next'

import { UpcomingPage } from '@/components/site/upcoming-page'
import { SETTING_KEYS } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Report an issue',
  description: 'Report outdated, inaccurate or inappropriate content on UniSpace.',
  alternates: { canonical: '/report' },
}

export default function ReportPage() {
  return (
    <UpcomingPage
      milestone="Arriving in Milestone 7"
      title="Report an issue"
      summary="Reporting sends content to a moderation queue for a human decision. It never deletes anything automatically."
      contactSettingKey={SETTING_KEYS.CONTACT_MODERATION_EMAIL}
      points={[
        'Report outdated campus tips, incorrect SRC details or misleading business listings.',
        'Every report is recorded with its outcome, and serious issues escalate to Super Admins.',
        'Published content stays up while a report is reviewed, except under an emergency safety procedure.',
      ]}
    />
  )
}
