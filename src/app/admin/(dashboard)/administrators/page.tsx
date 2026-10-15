import { Badge, Card, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { requirePermission } from '@/modules/admin/guard'
import { PERMISSIONS } from '@/modules/admin/rbac'

export default async function AdminAdministratorsPage() {
  await requirePermission(PERMISSIONS.ADMIN_READ)

  const [admins, roles] = await Promise.all([
    db.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        assignments: {
          where: { revokedAt: null },
          select: {
            scopeType: true,
            role: { select: { name: true } },
            university: { select: { acronym: true } },
            campus: { select: { name: true } },
          },
        },
      },
    }),
    db.adminRole.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Administrators"
        description="Accounts are created by invitation only. There is no public registration, and an administrator can never grant a permission they do not already hold in that scope."
      />

      <Card className="border-amber-300 bg-amber-50">
        <h2 className="text-sm font-bold text-amber-950">
          Inviting and assigning arrives in Milestone 7
        </h2>
        <p className="mt-1 text-sm text-amber-900">
          The role model, scoped assignments and the server-side checks that enforce them are live
          now. The screens for inviting administrators and editing assignments are built in the
          administration milestone. The first Super Admin is provisioned from the command line with{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5">npm run provision:super-admin</code>.
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Administrator accounts</caption>
          <thead className="border-b border-hairline text-xs uppercase tracking-wider text-content-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-bold">
                Name
              </th>
              <th scope="col" className="px-5 py-3 font-bold">
                Status
              </th>
              <th scope="col" className="px-5 py-3 font-bold">
                Assignments
              </th>
              <th scope="col" className="px-5 py-3 font-bold">
                Last sign-in
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-5 py-3">
                  <span className="font-semibold text-content">{admin.name}</span>
                  <span className="block text-xs text-content-muted">{admin.email}</span>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={admin.status === 'ACTIVE' ? 'positive' : 'muted'}>
                    {admin.status.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-xs text-content-muted">
                  {admin.assignments.length === 0
                    ? 'None'
                    : admin.assignments
                        .map((assignment) =>
                          [
                            assignment.role.name,
                            assignment.campus?.name ??
                              assignment.university?.acronym ??
                              'platform-wide',
                          ].join(' · '),
                        )
                        .join(', ')}
                </td>
                <td className="px-5 py-3 text-xs text-content-muted">
                  {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-bold text-content">Roles</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {roles.map((role) => (
            <li key={role.id}>
              <Card className="h-full">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-content">{role.name}</h3>
                  {role.isSystem ? <Badge tone="muted">built-in</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-content-muted">{role.description}</p>
                <p className="mt-2 text-xs font-semibold text-content-muted">
                  {role.permissions.length} permissions · assignable at{' '}
                  {role.allowedScopes.map((scope) => scope.toLowerCase()).join(', ')} scope
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
