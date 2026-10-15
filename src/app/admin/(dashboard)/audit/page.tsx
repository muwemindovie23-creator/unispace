import { Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { formatDateTime } from '@/lib/utils'
import { requirePermission } from '@/modules/admin/guard'
import { listRecentAudit } from '@/modules/admin/queries'
import { PERMISSIONS } from '@/modules/admin/rbac'

export default async function AdminAuditPage() {
  await requirePermission(PERMISSIONS.PLATFORM_AUDIT_READ)
  const entries = await listRecentAudit(100)

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Audit log"
        description="Sign-ins, role changes, publishing and verification decisions. Passwords, tokens and raw IP addresses are never recorded here."
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          description="Entries appear as administrators act on the platform."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Recent administrative actions</caption>
            <thead className="border-b border-hairline text-xs uppercase tracking-wider text-content-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-bold">
                  Action
                </th>
                <th scope="col" className="px-5 py-3 font-bold">
                  Administrator
                </th>
                <th scope="col" className="px-5 py-3 font-bold">
                  Target
                </th>
                <th scope="col" className="px-5 py-3 font-bold">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-5 py-3 font-semibold text-content">{entry.action}</td>
                  <td className="px-5 py-3 text-content-muted">{entry.actorEmail ?? 'system'}</td>
                  <td className="px-5 py-3 text-content-muted">{entry.targetType ?? '—'}</td>
                  <td className="px-5 py-3 text-content-muted">
                    <time dateTime={entry.createdAt.toISOString()}>
                      {formatDateTime(entry.createdAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
