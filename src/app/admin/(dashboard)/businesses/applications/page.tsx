import Link from 'next/link'

import { VerificationDecisionForm } from '@/components/admin/verification-decision-form'
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { formatDateTime, safeExternalUrl } from '@/lib/utils'
import { requireActor } from '@/modules/admin/guard'
import { can, PERMISSIONS, visibleUniverseOf } from '@/modules/admin/rbac'

/**
 * The verification queue.
 *
 * These records contain applicants' personal contact details, so the query is
 * scoped to the universities and campuses this administrator may review — not
 * filtered in the page after loading everything.
 */
export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const actor = await requireActor()
  const scope = visibleUniverseOf(actor)

  const scopeFilter = scope.isPlatformWide
    ? {}
    : {
        OR: [
          { universityId: { in: scope.universityIds } },
          { campusId: { in: scope.campusIds } },
        ],
      }

  const statusFilter =
    status && ['PENDING', 'VERIFIED', 'NEEDS_REVIEW', 'REJECTED', 'EXPIRED'].includes(status)
      ? { status: status as 'PENDING' }
      : { status: 'PENDING' as const }

  const applications = await db.businessApplication.findMany({
    where: { ...scopeFilter, ...statusFilter },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: {
      id: true,
      businessName: true,
      categoryHint: true,
      description: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      locationNote: true,
      website: true,
      evidenceNote: true,
      status: true,
      createdAt: true,
      universityId: true,
      campusId: true,
      university: { select: { acronym: true } },
      campus: { select: { name: true } },
      business: { select: { id: true, status: true, slug: true } },
    },
  })

  const statuses = ['PENDING', 'NEEDS_REVIEW', 'VERIFIED', 'REJECTED'] as const
  const active = statusFilter.status

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Business verification queue"
        description="Applications from businesses who want to be listed. Nothing here is public until it has been verified and the resulting draft listing is published."
      />

      <nav aria-label="Filter by status">
        <ul className="flex flex-wrap gap-2">
          {statuses.map((value) => (
            <li key={value}>
              <Link
                href={`/admin/businesses/applications?status=${value}`}
                aria-current={active === value ? 'page' : undefined}
                className={`inline-block rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  active === value
                    ? 'border-brand bg-brand text-brand-contrast'
                    : 'border-hairline bg-surface text-content-muted hover:border-brand hover:text-content'
                }`}
              >
                {value.toLowerCase().replace('_', ' ')}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {applications.length === 0 ? (
        <EmptyState
          title="Nothing in this queue"
          description="Applications arrive through the public “Become a Verified Campus Business” form."
        />
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => {
            const website = safeExternalUrl(application.website)
            const mayDecide = can(actor, PERMISSIONS.BUSINESS_VERIFY, {
              universityId: application.universityId,
              campusId: application.campusId,
            })

            return (
              <li key={application.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-content">
                        {application.businessName}
                      </h2>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {application.university.acronym}
                        {application.campus ? ` · ${application.campus.name}` : ''}
                        {application.categoryHint ? ` · ${application.categoryHint}` : ''}
                        {` · applied ${formatDateTime(application.createdAt)}`}
                      </p>
                    </div>
                    <Badge tone={application.status === 'VERIFIED' ? 'positive' : 'caution'}>
                      {application.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm text-content-muted">
                    {application.description}
                  </p>

                  <dl className="mt-4 grid gap-2 text-xs text-content-muted sm:grid-cols-2">
                    <div>
                      <dt className="font-bold text-content">Contact</dt>
                      <dd>
                        {application.contactName} ·{' '}
                        <a
                          href={`mailto:${application.contactEmail}`}
                          className="text-brand hover:underline"
                        >
                          {application.contactEmail}
                        </a>
                        {application.contactPhone ? ` · ${application.contactPhone}` : ''}
                      </dd>
                    </div>
                    {application.locationNote ? (
                      <div>
                        <dt className="font-bold text-content">Location</dt>
                        <dd>{application.locationNote}</dd>
                      </div>
                    ) : null}
                    {website ? (
                      <div>
                        <dt className="font-bold text-content">Website</dt>
                        <dd>
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-brand hover:underline"
                          >
                            {website}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {application.evidenceNote ? (
                      <div>
                        <dt className="font-bold text-content">Evidence offered</dt>
                        <dd>{application.evidenceNote}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {application.business ? (
                    application.business.status === 'PUBLISHED' ? (
                      <p className="mt-4 text-xs text-content-muted">
                        Listing is live.{' '}
                        <Link
                          href={`/admin/universities/${application.universityId}/businesses/${application.business.id}`}
                          className="font-semibold text-brand hover:underline"
                        >
                          Edit it
                        </Link>
                      </p>
                    ) : (
                      // The step that was easy to miss: a verified application
                      // produces a listing that is not public yet.
                      <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3">
                        <p className="text-sm font-bold text-amber-950">
                          Listing created, but not public yet
                        </p>
                        <p className="mt-1 text-sm text-amber-900">
                          It is saved as a{' '}
                          <strong>{application.business.status.toLowerCase().replace('_', ' ')}</strong>
                          , so students cannot see it in the directory. Review the copy and set its
                          status to Published.
                        </p>
                        <Link
                          href={`/admin/universities/${application.universityId}/businesses/${application.business.id}`}
                          className="mt-2 inline-block text-xs font-bold text-amber-950 underline underline-offset-2"
                        >
                          Open the listing and publish it →
                        </Link>
                      </div>
                    )
                  ) : null}

                  {mayDecide && !application.business ? (
                    <div className="mt-4">
                      <VerificationDecisionForm
                        applicationId={application.id}
                        canPublish={can(actor, PERMISSIONS.BUSINESS_PUBLISH, {
                          universityId: application.universityId,
                          campusId: application.campusId,
                        })}
                      />
                    </div>
                  ) : !mayDecide ? (
                    <p className="mt-4 text-xs text-content-muted">
                      You can see this application but cannot decide it.
                    </p>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
