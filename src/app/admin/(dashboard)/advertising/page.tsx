import Link from 'next/link'

import {
  EnquiryStatusForm,
  PlacementToggleForm,
} from '@/components/admin/advertising-forms'
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { formatDate, formatDateTime } from '@/lib/utils'
import { requirePermission } from '@/modules/admin/guard'
import { can, PERMISSIONS } from '@/modules/admin/rbac'
import {
  countEnquiriesByStatus,
  listAllPlacements,
  listEnquiries,
  type EnquiryRow,
} from '@/modules/advertising'

const STATUSES = ['NEW', 'IN_REVIEW', 'CONTACTED', 'APPROVED', 'DECLINED', 'CLOSED'] as const

export default async function AdvertisingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  // Enquiries contain a named contact's details, so reading them is gated.
  const actor = await requirePermission(PERMISSIONS.ADVERTISING_ENQUIRY_READ)

  const selected = STATUSES.includes(status as (typeof STATUSES)[number])
    ? (status as EnquiryRow['status'])
    : undefined

  const [enquiries, counts, placements] = await Promise.all([
    listEnquiries(selected),
    countEnquiriesByStatus(),
    can(actor, PERMISSIONS.ADVERTISING_PLACEMENT_MANAGE)
      ? listAllPlacements()
      : Promise.resolve([]),
  ])

  const canManage = can(actor, PERMISSIONS.ADVERTISING_ENQUIRY_MANAGE)

  return (
    <div className="space-y-10">
      <SectionHeading
        title="Advertising"
        description="Enquiries from businesses and organisers, and the placements offered on the public Advertise page."
      />

      {placements.length > 0 ? (
        <section>
          <h2 className="mb-1 text-sm font-bold text-content">Placements</h2>
          <p className="mb-4 text-xs text-content-muted">
            Only placements marked available appear on the public page. Nothing is on sale by
            default — we do not advertise inventory that does not exist.
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {placements.map((placement) => (
              <li key={placement.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-content">{placement.name}</h3>
                      {placement.description ? (
                        <p className="mt-0.5 text-xs text-content-muted">
                          {placement.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-content-muted">
                        {placement._count.enquiries} enquir
                        {placement._count.enquiries === 1 ? 'y' : 'ies'}
                        {placement.university ? ` · ${placement.university.acronym}` : ''}
                      </p>
                    </div>
                    <Badge tone={placement.isAvailable ? 'positive' : 'muted'}>
                      {placement.isAvailable ? 'available' : 'not offered'}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <PlacementToggleForm
                      placementId={placement.id}
                      isAvailable={placement.isAvailable}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-bold text-content">Enquiries</h2>

        <nav aria-label="Filter enquiries by status" className="mb-5">
          <ul className="flex flex-wrap gap-2">
            <li>
              <FilterChip href="/admin/advertising" isActive={!selected}>
                All
              </FilterChip>
            </li>
            {STATUSES.map((value) => (
              <li key={value}>
                <FilterChip
                  href={`/admin/advertising?status=${value}`}
                  isActive={selected === value}
                >
                  {value.toLowerCase().replace('_', ' ')} ({counts[value] ?? 0})
                </FilterChip>
              </li>
            ))}
          </ul>
        </nav>

        {enquiries.length === 0 ? (
          <EmptyState
            title="No enquiries here"
            description="Enquiries arrive through the public Advertise With Us page."
          />
        ) : (
          <ul className="space-y-4">
            {enquiries.map((enquiry) => (
              <li key={enquiry.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-content">{enquiry.organisation}</h3>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {enquiry.contactName} ·{' '}
                        <a
                          href={`mailto:${enquiry.contactEmail}`}
                          className="text-brand hover:underline"
                        >
                          {enquiry.contactEmail}
                        </a>
                        {enquiry.contactPhone ? ` · ${enquiry.contactPhone}` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {formatDateTime(enquiry.createdAt)}
                        {enquiry.universityAcronym ? ` · ${enquiry.universityAcronym}` : ''}
                        {enquiry.campusHint ? ` · ${enquiry.campusHint}` : ''}
                        {enquiry.placementName ? ` · ${enquiry.placementName}` : ''}
                      </p>
                    </div>
                    <Badge tone={enquiry.status === 'NEW' ? 'caution' : 'muted'}>
                      {enquiry.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm text-content-muted">
                    {enquiry.objective}
                  </p>

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-content-muted">
                    {enquiry.budgetRange ? (
                      <div className="flex gap-1.5">
                        <dt className="font-bold text-content">Budget</dt>
                        <dd>{enquiry.budgetRange}</dd>
                      </div>
                    ) : null}
                    {enquiry.preferredStart ? (
                      <div className="flex gap-1.5">
                        <dt className="font-bold text-content">From</dt>
                        <dd>{formatDate(enquiry.preferredStart)}</dd>
                      </div>
                    ) : null}
                    {enquiry.preferredEnd ? (
                      <div className="flex gap-1.5">
                        <dt className="font-bold text-content">To</dt>
                        <dd>{formatDate(enquiry.preferredEnd)}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {enquiry.notes ? (
                    <p className="mt-3 text-xs text-content-muted">{enquiry.notes}</p>
                  ) : null}

                  {enquiry.internalNote ? (
                    <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-xs text-content-muted">
                      <span className="font-bold text-content">Internal:</span>{' '}
                      {enquiry.internalNote}
                    </p>
                  ) : null}

                  {canManage ? (
                    <div className="mt-4">
                      <EnquiryStatusForm
                        enquiryId={enquiry.id}
                        currentStatus={enquiry.status}
                        internalNote={enquiry.internalNote}
                      />
                    </div>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function FilterChip({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`inline-block rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
        isActive
          ? 'border-brand bg-brand text-brand-contrast'
          : 'border-hairline bg-surface text-content-muted hover:border-brand hover:text-content'
      }`}
    >
      {children}
    </Link>
  )
}
