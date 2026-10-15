import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CampusForm } from '@/components/admin/campus-form'
import { DeleteCampusForm } from '@/components/admin/delete-campus-form'
import { Card, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS } from '@/modules/admin/rbac'

export default async function EditCampusPage({
  params,
}: {
  params: Promise<{ id: string; campusId: string }>
}) {
  const { id, campusId } = await params
  const actor = await requireActor()

  const campus = await db.campus.findUnique({
    where: { id: campusId },
    select: {
      id: true,
      universityId: true,
      name: true,
      slug: true,
      kind: true,
      description: true,
      city: true,
      profileStatus: true,
      isPrimary: true,
      isPublished: true,
      displayOrder: true,
      university: { select: { id: true, acronym: true } },
    },
  })

  // The campus must really belong to the university in the URL, so a guessed
  // id cannot be edited through someone else's university.
  if (!campus || campus.universityId !== id) notFound()

  assertCan(actor, PERMISSIONS.CAMPUS_UPDATE, {
    universityId: campus.universityId,
    campusId: campus.id,
  })

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link
          href={`/admin/universities/${id}/campuses`}
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← Campuses
        </Link>
        <SectionHeading
          eyebrow={campus.university.acronym}
          title={campus.name}
          className="mt-3"
        />
      </div>

      <CampusForm universityId={campus.universityId} campus={campus} />

      {can(actor, PERMISSIONS.CAMPUS_DELETE, {
        universityId: campus.universityId,
        campusId: campus.id,
      }) ? (
        <Card className="border-red-200 bg-red-50/60">
          <h2 className="text-sm font-bold text-red-950">Delete this campus</h2>
          <p className="mt-1 mb-4 text-sm text-red-900">
            Deletion is refused while any content or administrator assignment still points at this
            campus. If you only want to hide it from visitors, unpublish it instead.
          </p>
          <DeleteCampusForm campusId={campus.id} campusName={campus.name} />
        </Card>
      ) : null}
    </div>
  )
}
