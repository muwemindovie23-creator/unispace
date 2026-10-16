import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DeleteTourStopForm } from '@/components/admin/delete-tour-stop-form'
import { TourStopForm } from '@/components/admin/tour-stop-form'
import { Card, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS } from '@/modules/admin/rbac'
import { getTourStopForEdit } from '@/modules/tour'

export default async function EditTourStopPage({
  params,
}: {
  params: Promise<{ id: string; stopId: string }>
}) {
  const { id, stopId } = await params
  const actor = await requireActor()

  const stop = await getTourStopForEdit(stopId)
  // The stop must belong to the university named in the URL.
  if (!stop || stop.universityId !== id) notFound()

  assertCan(actor, PERMISSIONS.TOUR_WRITE, {
    universityId: stop.universityId,
    campusId: stop.campusId,
  })

  const campuses = await db.campus.findMany({
    where: { universityId: id },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true },
  })

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link
          href={`/admin/universities/${id}/tour`}
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← Virtual campus tour
        </Link>
        <SectionHeading
          eyebrow={stop.university.acronym}
          title={stop.title}
          className="mt-3"
        />
      </div>

      <TourStopForm
        universityId={stop.universityId}
        stop={stop}
        campuses={campuses}
        canPublish={can(actor, PERMISSIONS.TOUR_PUBLISH, {
          universityId: stop.universityId,
          campusId: stop.campusId,
        })}
      />

      <Card className="border-red-200 bg-red-50/60">
        <h2 className="text-sm font-bold text-red-950">Remove this stop</h2>
        <p className="mt-1 mb-4 text-sm text-red-900">
          This deletes the stop outright. To take it off the public tour without losing the text,
          set its status to Archived instead.
        </p>
        <DeleteTourStopForm stopId={stop.id} stopTitle={stop.title} />
      </Card>
    </div>
  )
}
