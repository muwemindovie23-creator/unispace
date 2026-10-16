import { BadgeCheck, MapPin, Megaphone } from 'lucide-react'
import Link from 'next/link'

import { Badge, Card } from '@/components/ui/primitives'
import { formatDate } from '@/lib/utils'
import type { BusinessCard as BusinessCardData } from '@/modules/businesses/queries'

/**
 * One business in the directory.
 *
 * Two labels matter here and are never merged: "Verified" says UniSpace
 * checked the listing's identity and contact details on a date, and
 * "Sponsored" says the business paid for placement. Neither implies the other,
 * and neither is a statement about quality.
 */
export function BusinessCard({
  business,
  universitySlug,
  index = 0,
}: {
  business: BusinessCardData
  universitySlug: string
  index?: number
}) {
  return (
    <Card
      as={Link}
      href={`/universities/${universitySlug}/businesses/${business.slug}`}
      className="us-stagger flex h-full flex-col transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-brand motion-reduce:hover:translate-y-0"
      style={{ '--stagger': index } as React.CSSProperties}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-bold leading-snug text-content">{business.name}</h3>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {business.isSponsored ? (
            <Badge tone="accent">
              <Megaphone aria-hidden className="h-3.5 w-3.5" />
              Sponsored
            </Badge>
          ) : null}
          {business.verificationStatus === 'VERIFIED' ? (
            <Badge tone="positive">
              <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
              Verified
            </Badge>
          ) : null}
        </div>
      </div>

      {business.categoryLabel ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-brand">
          {business.categoryLabel}
        </p>
      ) : null}

      <p className="line-clamp-3 text-sm text-content-muted">{business.description}</p>

      <dl className="mt-4 space-y-1.5 text-xs text-content-muted">
        {business.campusName || business.locationNote ? (
          <div className="flex items-start gap-1.5">
            <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <dt className="sr-only">Location</dt>
            <dd className="line-clamp-1">
              {[business.campusName, business.locationNote].filter(Boolean).join(' · ')}
            </dd>
          </div>
        ) : null}
        {business.priceRange ? (
          <div className="flex gap-1.5">
            <dt className="font-semibold">Prices</dt>
            <dd>{business.priceRange}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto pt-4">
        {business.verificationStatus === 'VERIFIED' && business.lastVerifiedAt ? (
          <p className="text-[0.7rem] text-content-muted">
            Checked {formatDate(business.lastVerifiedAt)}
          </p>
        ) : (
          <p className="text-[0.7rem] text-content-muted">Listing not yet verified</p>
        )}
      </div>
    </Card>
  )
}
