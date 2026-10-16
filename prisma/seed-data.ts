/**
 * Initial platform data.
 *
 * Rules this file follows, and that any addition to it must follow:
 *  - No invented people, businesses, events, prices or coordinates.
 *  - No campus list is asserted for a university. Campuses are added by
 *    administrators who know the institution, not guessed here.
 *  - An official website is only recorded where it was actually checked, and it
 *    still shows as "awaiting confirmation" until an administrator confirms it
 *    in the dashboard.
 *  - Colours are design directions or placeholders, never claimed as official
 *    brand colours. Every entry records that in `themeSourceNote`.
 */

export interface SeedTheme {
  primaryColor: string
  primaryContrast: string
  secondaryColor: string
  secondaryContrast: string
  accentColor: string
  accentContrast: string
  backgroundColor: string
  surfaceColor: string
  surfaceMutedColor: string
  textPrimaryColor: string
  textSecondaryColor: string
  borderColor: string
  highlightColor: string
  radius: string
}

export interface SeedUniversity {
  slug: string
  name: string
  acronym: string
  shortDescription: string
  officialWebsite: string | null
  /** How the website above was established, or why none is recorded. */
  officialWebsiteNote: string
  displayOrder: number
  theme: SeedTheme
  themeSourceNote: string
}

const NEUTRAL_RADIUS = '1.25rem'

export const INITIAL_UNIVERSITIES: SeedUniversity[] = [
  {
    slug: 'unima',
    name: 'University of Malawi',
    acronym: 'UNIMA',
    shortDescription:
      'Campus businesses, events, student representatives and campus tips for UNIMA students, in one place.',
    officialWebsite: 'https://www.unima.ac.mw',
    officialWebsiteNote:
      'Checked automatically on 2026-10-15: the page identifies itself as the University of Malawi and links to unima.ac.mw services. Awaiting administrator confirmation.',
    displayOrder: 1,
    theme: {
      primaryColor: '#0f6e72',
      primaryContrast: '#ffffff',
      secondaryColor: '#223a3c',
      secondaryContrast: '#ffffff',
      accentColor: '#f0a202',
      accentContrast: '#1f1500',
      backgroundColor: '#f9fcfc',
      surfaceColor: '#ffffff',
      surfaceMutedColor: '#edf5f5',
      textPrimaryColor: '#0d2224',
      textSecondaryColor: '#44595a',
      borderColor: '#d8e8e8',
      highlightColor: '#e1f0f0',
      radius: NEUTRAL_RADIUS,
    },
    themeSourceNote:
      'Placeholder palette chosen by UniSpace. These are NOT official UNIMA brand colours. Replace with the confirmed brand guideline before launch.',
  },
  {
    slug: 'must',
    name: 'Malawi University of Science and Technology',
    acronym: 'MUST',
    shortDescription:
      'What’s happening on campus at MUST — businesses, events, your SRC and the practical things students learn late.',
    officialWebsite: 'https://www.must.ac.mw',
    officialWebsiteNote:
      'Checked automatically on 2026-10-15: the page identifies itself as the Malawi University of Science and Technology and links to must.ac.mw services. Awaiting administrator confirmation.',
    displayOrder: 2,
    theme: {
      primaryColor: '#b3202c',
      primaryContrast: '#ffffff',
      secondaryColor: '#3f4750',
      secondaryContrast: '#ffffff',
      accentColor: '#d7dce1',
      accentContrast: '#1f2937',
      backgroundColor: '#fcfafa',
      surfaceColor: '#ffffff',
      surfaceMutedColor: '#f4f2f2',
      textPrimaryColor: '#1a1416',
      textSecondaryColor: '#56494c',
      borderColor: '#eadfe0',
      highlightColor: '#fbe9ea',
      radius: NEUTRAL_RADIUS,
    },
    themeSourceNote:
      'Red and grey is the design direction given in the UniSpace product brief, not a confirmed brand specification. Confirm the exact values against MUST’s official brand guidelines.',
  },
  {
    slug: 'kuhes',
    name: 'Kamuzu University of Health Sciences',
    acronym: 'KUHeS',
    shortDescription:
      'Campus life at KUHeS: events, student communities, representatives and everyday campus know-how.',
    officialWebsite: 'https://www.kuhes.ac.mw',
    officialWebsiteNote:
      'Checked automatically on 2026-10-15: the page identifies itself as Kamuzu University of Health Sciences and links to kuhes.ac.mw services. Awaiting administrator confirmation.',
    displayOrder: 3,
    theme: {
      primaryColor: '#3a4fa0',
      primaryContrast: '#ffffff',
      secondaryColor: '#232b45',
      secondaryContrast: '#ffffff',
      accentColor: '#e4e9f7',
      accentContrast: '#1c2340',
      backgroundColor: '#fafafe',
      surfaceColor: '#ffffff',
      surfaceMutedColor: '#f0f2fa',
      textPrimaryColor: '#141a33',
      textSecondaryColor: '#4c5471',
      borderColor: '#dee2f2',
      highlightColor: '#e8ecfa',
      radius: NEUTRAL_RADIUS,
    },
    themeSourceNote:
      'Placeholder palette chosen by UniSpace. These are NOT official KUHeS brand colours. Replace with the confirmed brand guideline before launch.',
  },
  {
    slug: 'luanar',
    name: 'Lilongwe University of Agriculture and Natural Resources',
    acronym: 'LUANAR',
    shortDescription:
      'Find campus businesses, events, student representatives and campus tips for LUANAR students.',
    officialWebsite: null,
    officialWebsiteNote:
      'Not recorded. An automated check on 2026-10-15 could not complete because the site presented an incomplete TLS certificate chain. An administrator must confirm the correct official URL in the dashboard before it is published.',
    displayOrder: 4,
    theme: {
      primaryColor: '#1c7a3f',
      primaryContrast: '#ffffff',
      secondaryColor: '#41484a',
      secondaryContrast: '#ffffff',
      accentColor: '#d5e3d7',
      accentContrast: '#14321f',
      backgroundColor: '#fafcfa',
      surfaceColor: '#ffffff',
      surfaceMutedColor: '#eff5f0',
      textPrimaryColor: '#10231a',
      textSecondaryColor: '#49584f',
      borderColor: '#dce7df',
      highlightColor: '#e4f0e7',
      radius: NEUTRAL_RADIUS,
    },
    themeSourceNote:
      'Green and grey is the design direction given in the UniSpace product brief, not a confirmed brand specification. Confirm the exact values against LUANAR’s official brand guidelines.',
  },
  {
    slug: 'mzuni',
    name: 'Mzuzu University',
    acronym: 'MZUNI',
    shortDescription:
      'The student side of MZUNI: open airs, campus businesses, your SRC and discoveries worth knowing.',
    officialWebsite: 'https://www.mzuni.ac.mw',
    officialWebsiteNote:
      'Checked automatically on 2026-10-15: the page identifies itself as Mzuzu University and links to mzuni.ac.mw services. Awaiting administrator confirmation.',
    displayOrder: 5,
    theme: {
      primaryColor: '#b8530a',
      primaryContrast: '#ffffff',
      secondaryColor: '#3a2a1e',
      secondaryContrast: '#ffffff',
      accentColor: '#ffe2c7',
      accentContrast: '#3a2208',
      backgroundColor: '#fffbf8',
      surfaceColor: '#ffffff',
      surfaceMutedColor: '#fbf0e8',
      textPrimaryColor: '#2a1b10',
      textSecondaryColor: '#66503f',
      borderColor: '#f0e0d4',
      highlightColor: '#fceadb',
      radius: NEUTRAL_RADIUS,
    },
    themeSourceNote:
      'Placeholder palette chosen by UniSpace. These are NOT official Mzuzu University brand colours. Replace with the confirmed brand guideline before launch.',
  },
  {
    slug: 'mubas',
    name: 'Malawi University of Business and Applied Sciences',
    acronym: 'MUBAS',
    shortDescription:
      'Campus businesses, events, student representatives and know-how for MUBAS students.',
    officialWebsite: 'https://www.mubas.ac.mw',
    officialWebsiteNote:
      'Checked automatically on 2026-10-15: the page identifies itself as the Malawi University of Business and Applied Sciences and links to mubas.ac.mw services. Awaiting administrator confirmation.',
    displayOrder: 6,
    theme: {
      primaryColor: '#123e8c',
      primaryContrast: '#ffffff',
      secondaryColor: '#1b2a4a',
      secondaryContrast: '#ffffff',
      accentColor: '#f2b705',
      accentContrast: '#1f1500',
      backgroundColor: '#fafbff',
      surfaceColor: '#ffffff',
      surfaceMutedColor: '#eff3fb',
      textPrimaryColor: '#0e1a33',
      textSecondaryColor: '#495673',
      borderColor: '#dce4f4',
      highlightColor: '#e6edfb',
      radius: NEUTRAL_RADIUS,
    },
    themeSourceNote:
      'Blue and yellow is the design direction given in the UniSpace product brief, not a confirmed brand specification. Confirm the exact values against MUBAS’s official brand guidelines.',
  },
]

/**
 * Default, platform-wide categories. They are rows so administrators can add,
 * rename or retire one from the dashboard without a code change.
 */
export const INITIAL_TAXONOMY: {
  kind: 'EVENT' | 'TIP' | 'BUSINESS' | 'SRC_PORTFOLIO'
  terms: { slug: string; label: string }[]
}[] = [
  {
    kind: 'EVENT',
    terms: [
      { slug: 'open-air', label: 'Open air' },
      { slug: 'freshers', label: 'Freshers’ event' },
      { slug: 'student-group', label: 'Student group event' },
      { slug: 'sports', label: 'Sports' },
      { slug: 'cultural', label: 'Cultural festival' },
      { slug: 'meetup', label: 'Student meetup' },
      { slug: 'innovation', label: 'Innovation showcase' },
      { slug: 'career', label: 'Career & networking' },
      { slug: 'entertainment', label: 'Entertainment' },
      { slug: 'other', label: 'Other' },
    ],
  },
  {
    kind: 'TIP',
    terms: [
      { slug: 'food', label: 'Food & eating' },
      { slug: 'printing', label: 'Printing & stationery' },
      { slug: 'study-spots', label: 'Study spots' },
      { slug: 'getting-around', label: 'Getting around' },
      { slug: 'essentials', label: 'Everyday essentials' },
      { slug: 'campus-services', label: 'Campus services' },
      { slug: 'money-saving', label: 'Saving money' },
      { slug: 'new-students', label: 'For new students' },
    ],
  },
  {
    kind: 'BUSINESS',
    terms: [
      { slug: 'food-vendor', label: 'Food & restaurants' },
      { slug: 'printing-copying', label: 'Printing & photocopying' },
      { slug: 'barber-salon', label: 'Barbers & salons' },
      { slug: 'shop', label: 'Shops & essentials' },
      { slug: 'laundry', label: 'Laundry' },
      { slug: 'accommodation', label: 'Accommodation' },
      { slug: 'repairs', label: 'Repairs' },
      { slug: 'stationery', label: 'Stationery' },
      { slug: 'other-service', label: 'Other services' },
    ],
  },
]

/** Placements a Super Admin can later make available. None is live at launch. */
export const INITIAL_AD_PLACEMENTS = [
  {
    key: 'sponsored-event',
    name: 'Sponsored event feature',
    description: 'A clearly labelled sponsored event in a university’s events hub.',
  },
  {
    key: 'sponsored-business',
    name: 'Sponsored business listing',
    description: 'A labelled sponsored listing within the campus business directory.',
  },
  {
    key: 'featured-campus-content',
    name: 'Featured campus content',
    description: 'A labelled sponsored placement within campus life content.',
  },
  {
    key: 'homepage-placement',
    name: 'Sponsored homepage placement',
    description: 'A labelled sponsored placement on a university homepage.',
  },
]
