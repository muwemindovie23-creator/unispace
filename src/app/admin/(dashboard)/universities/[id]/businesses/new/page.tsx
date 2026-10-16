import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BusinessForm } from '@/components/admin/business-form'
import { SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS } from '@/modules/admin/rbac'

export default async function NewBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.BUSINESS_WRITE, { universityId: id })

  const [university, categories] = await Promise.all([
    db.university.findUnique({
      where: { id },
      select: {
        id: true,
        acronym: true,
        campuses: {
          orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
          select: { id: true, name: true },
        },
      },
    }),
    db.taxonomyTerm.findMany({
      where: { kind: 'BUSINESS', isActive: true, OR: [{ universityId: null }, { universityId: id }] },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, label: true },
    }),
  ])
  if (!university) notFound()

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link
          href={`/admin/universities/${id}/businesses`}
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← Campus businesses
        </Link>
        <SectionHeading
          eyebrow={university.acronym}
          title="Add a listing"
          description="Add a business you have confirmed exists. If it applied through the public form, verify the application instead so the decision is recorded."
          className="mt-3"
        />
      </div>

      <BusinessForm
        universityId={university.id}
        campuses={university.campuses}
        categories={categories}
        canPublish={can(actor, PERMISSIONS.BUSINESS_PUBLISH, { universityId: university.id })}
        canSponsor={can(actor, PERMISSIONS.ADVERTISING_PLACEMENT_MANAGE)}
      />
    </div>
  )
}
