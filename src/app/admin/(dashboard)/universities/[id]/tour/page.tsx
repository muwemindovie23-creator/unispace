import Link from 'next/link'
import { notFound } from 'next/navigation'

import { TourStopForm } from '@/components/admin/tour-stop-form'
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS } from '@/modules/admin/rbac'
import { listManageableTourStops } from '@/modules/tour'

export default async function AdminTourPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.TOUR_READ, { universityId: id })

  const university = await db.university.findUnique({
    where: { id },
    select: {
      id: true,
      acronym: true,
      slug: true,
      campuses: {
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true },
      },
    },
  })
  if (!university) notFound()

  const stops = await listManageableTourStops(university.id)
  const canWrite = can(actor, PERMISSIONS.TOUR_WRITE, { universityId: university.id })

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/universities/${university.id}`}
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← {university.acronym}
        </Link>
        <SectionHeading
          eyebrow={university.acronym}
          title="Virtual campus tour"
          description="An ordered walk through the places students actually use. Each stop needs a map before it can be published."
          className="mt-3"
          action={
            <Link
              href={`/universities/${university.slug}/tour`}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View public tour
            </Link>
          }
        />
      </div>

      {stops.length === 0 ? (
        <EmptyState
          title="No tour stops yet"
          description="Add the first stop below. Start where a new student would arrive, and walk from there."
        />
      ) : (
        <ol className="space-y-3">
          {stops.map((stop, index) => {
            const hasMap =
              stop.mapEmbedUrl !== null ||
              (stop.latitude !== null && stop.longitude !== null) ||
              (stop.placeQuery !== null && stop.placeQuery.length > 2)

            return (
              <li key={stop.id}>
                <Card className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-highlight text-xs font-black text-brand">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-content">{stop.title}</h2>
                        <Badge tone={stop.status === 'PUBLISHED' ? 'positive' : 'muted'}>
                          {stop.status.toLowerCase().replace('_', ' ')}
                        </Badge>
                        {!hasMap ? <Badge tone="caution">no map</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-content-muted">
                        {stop.campus?.name ?? 'University-wide'} · order {stop.displayOrder}
                      </p>
                    </div>
                  </div>

                  {canWrite ? (
                    <Link
                      href={`/admin/universities/${university.id}/tour/${stop.id}`}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Edit
                    </Link>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ol>
      )}

      {canWrite ? (
        <div className="max-w-3xl">
          <SectionHeading title="Add a stop" className="mb-5" />
          <TourStopForm
            universityId={university.id}
            campuses={university.campuses}
            canPublish={can(actor, PERMISSIONS.TOUR_PUBLISH, { universityId: university.id })}
          />
        </div>
      ) : null}
    </div>
  )
}
