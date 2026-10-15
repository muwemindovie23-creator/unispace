import Link from 'next/link'

import { Badge, Card, SectionHeading } from '@/components/ui/primitives'
import { formatDate } from '@/lib/utils'
import { requirePermission } from '@/modules/admin/guard'
import { PERMISSIONS } from '@/modules/admin/rbac'
import { listLegalVersions } from '@/modules/legal/queries'

export default async function AdminLegalPage() {
  await requirePermission(PERMISSIONS.LEGAL_READ)

  const [privacy, terms] = await Promise.all([
    listLegalVersions('PRIVACY_POLICY'),
    listLegalVersions('TERMS_OF_USE'),
  ])

  const documents = [
    { title: 'Privacy Policy', href: '/privacy', versions: privacy },
    { title: 'Terms of Use', href: '/terms', versions: terms },
  ]

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Legal documents"
        description="Version history is kept for every legal document. Published text is never silently overwritten — publishing creates a new version."
      />

      <Card className="border-amber-300 bg-amber-50">
        <h2 className="text-sm font-bold text-amber-950">Editing arrives in Milestone 7</h2>
        <p className="mt-1 text-sm text-amber-900">
          Version 1 of each document is published and live. The in-dashboard editor, draft preview
          and publishing workflow are built in the legal and moderation milestone, so that version
          history and effective dates are handled properly rather than bolted on.
        </p>
      </Card>

      <ul className="space-y-4">
        {documents.map((document) => (
          <li key={document.title}>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-content">{document.title}</h2>
                <Link
                  href={document.href}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  View public page
                </Link>
              </div>

              <ul className="mt-4 space-y-2">
                {document.versions.map((version) => (
                  <li
                    key={version.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-2.5 text-sm"
                  >
                    <span className="font-semibold text-content">Version {version.version}</span>
                    <span className="text-xs text-content-muted">
                      {version.summaryOfChanges ?? 'No summary recorded'}
                    </span>
                    <span className="flex items-center gap-2">
                      {version.isMaterialChange ? (
                        <Badge tone="caution">Material change</Badge>
                      ) : null}
                      <Badge tone={version.status === 'PUBLISHED' ? 'positive' : 'muted'}>
                        {version.status.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-content-muted">
                        {version.effectiveAt ? formatDate(version.effectiveAt) : '—'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
