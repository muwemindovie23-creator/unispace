import type { Metadata } from 'next'

import { UpcomingPage } from '@/components/site/upcoming-page'
import { SETTING_KEYS } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Advertise With Us',
  description: 'Reach students at a specific university or campus through clearly labelled placements.',
  alternates: { canonical: '/advertise' },
}

export default function AdvertisePage() {
  return (
    <UpcomingPage
      milestone="Arriving in Milestone 6"
      title="Advertise With Us"
      summary="UniSpace will offer campus-specific placements to businesses, event organisers and student-focused brands. We will publish the audience we actually have — never invented reach figures."
      contactSettingKey={SETTING_KEYS.CONTACT_ADVERTISING_EMAIL}
      points={[
        'Submit an enquiry describing your campaign, target campus and preferred dates.',
        'Every paid placement is labelled “Sponsored” or “Advertisement”.',
        'Advertising never affects a business verification decision or a poll result.',
      ]}
    />
  )
}
