import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components (the `use cache` model) is deliberately left off. UniSpace
  // uses conventional ISR: public pages declare `export const revalidate`, and
  // the administrator area is `force-dynamic`. That is simpler to reason about
  // for a team maintaining campus content, and the two are mutually exclusive.
  // (`partialPrefetching` requires Cache Components, so it is off too.)
  cacheComponents: false,

  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },

  // Images come from administrator-supplied URLs. Hosts must be allow-listed
  // here before next/image will load them; add the storage provider's domain
  // when image uploads are configured.
  images: {
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
