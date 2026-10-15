import type { MetadataRoute } from 'next'

import {
  listPublishedCampusPaths,
  listPublishedUniversitySlugs,
} from '@/modules/universities/queries'
import { HOMEPAGE_SECTIONS } from '@/modules/universities/sections'

export const revalidate = 3600

const STATIC_PATHS = [
  '/',
  '/universities/official-websites',
  '/businesses/verify',
  '/advertise',
  '/contact',
  '/report',
  '/accessibility',
  '/privacy',
  '/terms',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? 'http://localhost:3000'
  const lastModified = new Date()

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === '/' ? 'daily' : 'monthly',
    priority: path === '/' ? 1 : 0.5,
  }))

  const [slugs, campusPaths] = await Promise.all([
    listPublishedUniversitySlugs(),
    listPublishedCampusPaths(),
  ])
  const sectionHrefs: string[] = Object.values(HOMEPAGE_SECTIONS).flatMap((section) =>
    section.href === null ? [] : [section.href],
  )

  for (const slug of slugs) {
    entries.push({
      url: `${base}/universities/${slug}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    })

    for (const href of sectionHrefs) {
      entries.push({
        url: `${base}/universities/${slug}/${href}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  }

  for (const path of campusPaths) {
    entries.push({
      url: `${base}/universities/${path.universitySlug}/campus/${path.campusSlug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  return entries
}
