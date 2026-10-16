import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CampusForm } from '@/components/admin/campus-form'
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS, visibleUniverseOf } from '@/modules/admin/rbac'

export default async function CampusesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const actor = await requireActor()

  // Campus admins can reach this list to edit their own campuses, so the gate
  // here is "read", and each row is filtered and re-checked below.
  assertCan(actor, PERMISSIONS.EVENT_READ, { universityId: id })

  const university = await db.university.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      acronym: true,
      slug: true,
      campuses: {
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          kind: true,
          city: true,
          isPrimary: true,
          isPublished: true,
          profileStatus: true,
          _count: { select: { events: true, tourStops: true, tips: true, businesses: true } },
        },
      },
    },
  })
  if (!university) notFound()

  const scope = visibleUniverseOf(actor)
  const visibleCampuses = scope.isPlatformWide || scope.universityIds.includes(university.id)
    ? university.campuses
    : university.campuses.filter((campus) => scope.campusIds.includes(campus.id))

  const canCreate = can(actor, PERMISSIONS.CAMPUS_CREATE, { universityId: university.id })

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
          title="Campuses"
          description="A university may have one campus, several, or constituent colleges. Add only the ones you can confirm — content can then be scoped university-wide or to a single campus."
          className="mt-3"
        />
      </div>

      {visibleCampuses.length === 0 ? (
        <EmptyState
          title="No campuses yet"
          description={
            canCreate
              ? 'Add the first campus below. Until a university has at least two published campuses, visitors see no campus selector.'
              : 'No campuses in your scope. A Super Admin or University Admin adds them.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {visibleCampuses.map((campus) => {
            const contentCount =
              campus._count.events +
              campus._count.tourStops +
              campus._count.tips +
              campus._count.businesses

            return (
              <li key={campus.id}>
                <Card className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-content">{campus.name}</h2>
                      {campus.isPrimary ? <Badge tone="brand">Main</Badge> : null}
                      <Badge tone={campus.isPublished ? 'positive' : 'muted'}>
                        {campus.isPublished ? 'Published' : 'Unpublished'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-content-muted">
                      /{campus.slug}
                      {campus.kind ? ` · ${campus.kind}` : ''}
                      {campus.city ? ` · ${campus.city}` : ''}
                      {` · ${contentCount} content item${contentCount === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    {can(actor, PERMISSIONS.CAMPUS_UPDATE, {
                      universityId: university.id,
                      campusId: campus.id,
                    }) ? (
                      <Link
                        href={`/admin/universities/${university.id}/campuses/${campus.id}`}
                        className="text-brand hover:underline"
                      >
                        Edit
                      </Link>
                    ) : null}
                    {campus.isPublished ? (
                      <Link
                        href={`/universities/${university.slug}/campus/${campus.slug}`}
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

      {canCreate ? (
        <div className="max-w-3xl">
          <SectionHeading title="Add a campus" className="mb-5" />
          <CampusForm universityId={university.id} />
        </div>
      ) : null}
    </div>
  )
}
