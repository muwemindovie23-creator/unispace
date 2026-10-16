import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BusinessForm } from '@/components/admin/business-form'
import { Badge, Card, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS } from '@/modules/admin/rbac'

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string; businessId: string }>
}) {
  const { id, businessId } = await params
  const actor = await requireActor()

  const business = await db.campusBusiness.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      universityId: true,
      campusId: true,
      name: true,
      slug: true,
      description: true,
      categoryId: true,
      locationNote: true,
      latitude: true,
      longitude: true,
      mapEmbedUrl: true,
      showOnMap: true,
      publicPhone: true,
      publicEmail: true,
      priceRange: true,
      services: true,
      status: true,
      isSponsored: true,
      verificationStatus: true,
      university: { select: { acronym: true } },
      verifications: {
        orderBy: { decidedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          toStatus: true,
          checksPerformed: true,
          note: true,
          decidedAt: true,
          reviewer: { select: { name: true } },
        },
      },
    },
  })

  // The listing must belong to the university in the URL.
  if (!business || business.universityId !== id) notFound()

  assertCan(actor, PERMISSIONS.BUSINESS_WRITE, {
    universityId: business.universityId,
    campusId: business.campusId,
  })

  const [campuses, categories] = await Promise.all([
    db.campus.findMany({
      where: { universityId: id },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    db.taxonomyTerm.findMany({
      where: { kind: 'BUSINESS', isActive: true, OR: [{ universityId: null }, { universityId: id }] },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, label: true },
    }),
  ])

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link
          href={`/admin/universities/${id}/businesses`}
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← Campus businesses
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SectionHeading eyebrow={business.university.acronym} title={business.name} />
          <Badge tone={business.verificationStatus === 'VERIFIED' ? 'positive' : 'caution'}>
            {business.verificationStatus.toLowerCase().replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <BusinessForm
        universityId={business.universityId}
        business={business}
        campuses={campuses}
        categories={categories}
        canPublish={can(actor, PERMISSIONS.BUSINESS_PUBLISH, {
          universityId: business.universityId,
          campusId: business.campusId,
        })}
        canSponsor={can(actor, PERMISSIONS.ADVERTISING_PLACEMENT_MANAGE)}
      />

      {business.verifications.length > 0 ? (
        <Card>
          <h2 className="text-sm font-bold text-content">Verification history</h2>
          <p className="mt-1 mb-3 text-xs text-content-muted">
            What the badge is based on. The most recent “verified” entry is shown to the public.
          </p>
          <ul className="space-y-3">
            {business.verifications.map((entry) => (
              <li key={entry.id} className="border-t border-hairline pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={entry.toStatus === 'VERIFIED' ? 'positive' : 'muted'}>
                    {entry.toStatus.toLowerCase().replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-content-muted">
                    {formatDateTime(entry.decidedAt)}
                    {entry.reviewer ? ` · ${entry.reviewer.name}` : ''}
                  </span>
                </div>
                {entry.checksPerformed ? (
                  <p className="mt-1.5 text-sm text-content-muted">
                    <span className="font-semibold text-content">Checked:</span>{' '}
                    {entry.checksPerformed}
                  </p>
                ) : null}
                {entry.note ? (
                  <p className="mt-1 text-xs text-content-muted">{entry.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
