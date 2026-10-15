import type { Metadata } from 'next'

import { UpcomingPage } from '@/components/site/upcoming-page'
import { SETTING_KEYS } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Become a Verified Campus Business',
  description: 'Apply to list your business on UniSpace, and see exactly what verification means.',
  alternates: { canonical: '/businesses/verify' },
}

export default function BusinessVerificationPage() {
  return (
    <UpcomingPage
      milestone="Arriving in Milestone 5"
      title="Become a Verified Campus Business on UniSpace"
      summary="Students look for food, printing, laundry, barbers and everyday services around campus. Listing puts your business where they are already looking."
      contactSettingKey={SETTING_KEYS.CONTACT_GENERAL_EMAIL}
      points={[
        'Apply with your business details, campus and the evidence we ask for.',
        'Verification confirms that your identity and contact details were checked — it is not a quality, safety, licensing or university endorsement.',
        'Applying does not guarantee verification or publication, and badges can be renewed or withdrawn.',
      ]}
    />
  )
}
