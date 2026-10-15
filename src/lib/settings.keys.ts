/**
 * Setting keys and their descriptions.
 *
 * Kept separate from the database helpers so scripts that run outside Next.js
 * (the seed, the provisioning CLI) can import them without pulling in
 * `server-only` or a Prisma client.
 *
 * Contact addresses in particular must never be hard-coded through the
 * codebase — they are configured once in the dashboard and read everywhere.
 */

export const SETTING_KEYS = {
  CONTACT_GENERAL_EMAIL: 'contact.general_email',
  CONTACT_PRIVACY_EMAIL: 'contact.privacy_email',
  CONTACT_LEGAL_EMAIL: 'contact.legal_email',
  CONTACT_ADVERTISING_EMAIL: 'contact.advertising_email',
  CONTACT_MODERATION_EMAIL: 'contact.moderation_email',
  PLATFORM_OPERATOR_NAME: 'platform.operator_name',
  LEGAL_REVIEW_STATUS: 'legal.review_status',
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]

export const SETTING_DESCRIPTIONS: Record<SettingKey, string> = {
  [SETTING_KEYS.CONTACT_GENERAL_EMAIL]: 'Address shown for general enquiries.',
  [SETTING_KEYS.CONTACT_PRIVACY_EMAIL]:
    'Address for privacy requests, referenced by the Privacy Policy.',
  [SETTING_KEYS.CONTACT_LEGAL_EMAIL]:
    'Address for legal and intellectual-property notices, referenced by the Terms of Use.',
  [SETTING_KEYS.CONTACT_ADVERTISING_EMAIL]: 'Address for advertising enquiries.',
  [SETTING_KEYS.CONTACT_MODERATION_EMAIL]: 'Address for abuse reports and moderation escalations.',
  [SETTING_KEYS.PLATFORM_OPERATOR_NAME]:
    'The legal name of the organisation operating UniSpace, shown in legal documents.',
  [SETTING_KEYS.LEGAL_REVIEW_STATUS]:
    'Either "pending" or "reviewed". While "pending", legal pages show a notice that the text has not yet had independent legal review.',
}
