import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? 'http://localhost:3000'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The administrator area is never indexed.
        disallow: ['/admin', '/admin/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
