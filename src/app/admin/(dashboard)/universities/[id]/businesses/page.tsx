import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button'
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS, visibleUniverseOf } from '@/modules/admin/rbac'

export default async function AdminBusinessesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.BUSINESS_READ, { universityId: id })

  const university = await db.university.findUnique({
    where: { id },
    select: {
      id: true,
      acronym: true,
      slug: true,
      businesses: {
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          verificationStatus: true,
          lastVerifiedAt: true,
          isSponsored: true,
          showOnMap: true,
          latitude: true,
          mapEmbedUrl: true,
          campus: { select: { id: true, name: true } },
          category: { select: { label: true } },
        },
      },
    },
  })
  if (!university) notFound()

  // Campus admins see only their own campuses' listings.
  const scope = visibleUniverseOf(actor)
  const isUniversityWide = scope.isPlatformWide || scope.universityIds.includes(university.id)
  const businesses = isUniversityWide
    ? university.businesses
    : university.businesses.filter(
        (business) => business.campus && scope.campusIds.includes(business.campus.id),
      )

  return (
    <div className="space-y-7">
      <div>
        <Link
          href={`/admin/universities/${university.id}`}
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← {university.acronym}
        </Link>
        <SectionHeading
          eyebrow={university.acronym}
          title="Campus businesses"
          description="Listings students see in the directory and on the campus map."
          className="mt-3"
          action={
            can(actor, PERMISSIONS.BUSINESS_WRITE, { universityId: university.id }) ? (
              <ButtonLink href={`/admin/universities/${university.id}/businesses/new`} size="sm">
                Add listing
              </ButtonLink>
            ) : null
          }
        />
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Businesses reach this list either by applying through the public form and being verified, or by being added here directly."
          action={
            <ButtonLink href="/admin/businesses/applications" variant="outline" size="sm">
              Review applications
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-3">
          {businesses.map((business) => {
            const hasMap = business.mapEmbedUrl !== null || business.latitude !== null

            return (
              <li key={business.id}>
                <Card className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-content">{business.name}</h2>
                      <Badge tone={business.status === 'PUBLISHED' ? 'positive' : 'muted'}>
                        {business.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                      {business.verificationStatus === 'VERIFIED' ? (
                        <Badge tone="positive">verified</Badge>
                      ) : (
                        <Badge tone="caution">
                          {business.verificationStatus.toLowerCase().replace('_', ' ')}
                        </Badge>
                      )}
                      {business.isSponsored ? <Badge tone="accent">sponsored</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-content-muted">
                      {business.category?.label ?? 'No category'}
                      {' · '}
                      {business.campus?.name ?? 'University-wide'}
                      {' · '}
                      {hasMap && business.showOnMap ? 'on the map' : 'no map location'}
                      {business.lastVerifiedAt
                        ? ` · checked ${formatDate(business.lastVerifiedAt)}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <Link
                      href={`/admin/universities/${university.id}/businesses/${business.id}`}
                      className="text-brand hover:underline"
                    >
                      Edit
                    </Link>
                    {business.status === 'PUBLISHED' ? (
                      <Link
                        href={`/universities/${university.slug}/businesses/${business.slug}`}
                        className="text-content-muted hover:text-brand"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
