/**
 * The registry of sections a university or campus homepage can show.
 *
 * `UniversityHomepageSection.sectionKey` rows point at these keys, which is how
 * an administrator chooses what appears on their homepage without a code change.
 * The milestone note records which release fills each section with live data.
 */
export const HOMEPAGE_SECTIONS = {
  events: {
    key: 'events',
    label: 'Upcoming events & open airs',
    description: 'Events happening across the university and its campuses.',
    href: 'events',
  },
  societies: {
    key: 'societies',
    label: 'Societies & student communities',
    description: 'Clubs, teams and communities students can join.',
    href: 'societies',
  },
  src: {
    key: 'src',
    label: 'Know your SRC',
    description: 'Student representatives, their portfolios and official contacts.',
    href: 'src',
  },
  tips: {
    key: 'tips',
    label: 'Did you know?',
    description: 'Practical campus knowledge, labelled by how well it is checked.',
    href: 'tips',
  },
  polls: {
    key: 'polls',
    label: 'Campus polls',
    description: 'Informal polls anyone can vote in, no account needed.',
    href: 'polls',
  },
  businesses: {
    key: 'businesses',
    label: 'Campus businesses',
    description: 'Student-focused businesses and services around campus.',
    href: 'businesses',
  },
  official: {
    key: 'official',
    label: 'Official university information',
    description: 'Verified links to the university’s own website.',
    href: null,
  },
} as const

export type HomepageSectionKey = keyof typeof HOMEPAGE_SECTIONS

export const DEFAULT_SECTION_ORDER: HomepageSectionKey[] = [
  'events',
  'src',
  'societies',
  'tips',
  'polls',
  'businesses',
  'official',
]

/**
 * `Object.hasOwn`, not `in`: `in` walks the prototype chain, so "constructor",
 * "toString" and "__proto__" would all pass and could be written to the
 * database as section keys by a forged form submission.
 */
export function isHomepageSectionKey(value: string): value is HomepageSectionKey {
  return Object.hasOwn(HOMEPAGE_SECTIONS, value)
}
