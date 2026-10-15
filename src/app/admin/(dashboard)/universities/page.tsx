import Link from 'next/link'

import { OfficialWebsiteForm } from '@/components/admin/official-website-form'
import { ButtonLink } from '@/components/ui/button'
import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { formatDate } from '@/lib/utils'
import { requireActor } from '@/modules/admin/guard'
import { listManageableUniversities } from '@/modules/admin/queries'
import { can, PERMISSIONS } from '@/modules/admin/rbac'

export default async function AdminUniversitiesPage() {
  const actor = await requireActor()
  const universities = await listManageableUniversities(actor)

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Universities"
        description="Each university's identity, campuses and official links are data. Adding a seventh university is a dashboard task, not a deployment."
        action={
          can(actor, PERMISSIONS.UNIVERSITY_CREATE) ? (
            <ButtonLink href="/admin/universities/new" size="sm">
              Add university
            </ButtonLink>
          ) : null
        }
      />

      {universities.length === 0 ? (
        <EmptyState
          title="No universities in your scope"
          description="A Super Admin assigns you to a university or to specific campuses."
        />
      ) : (
        <ul className="space-y-4">
          {universities.map((university) => (
            <li key={university.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/admin/universities/${university.id}`}
                        className="text-base font-bold text-content hover:text-brand"
                      >
                        {university.name}
                      </Link>
                      <Badge tone="brand">{university.acronym}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-content-muted">
                      {university.campuses.length === 0
                        ? 'No campuses added yet — campuses are added by administrators who know the institution.'
                        : university.campuses.map((campus) => campus.name).join(' · ')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={university.isPublished ? 'positive' : 'muted'}>
                      {university.isPublished ? 'Published' : 'Unpublished'}
                    </Badge>
                    <TabLink href={`/admin/universities/${university.id}`}>Edit</TabLink>
                    <TabLink href={`/admin/universities/${university.id}/campuses`}>
                      Campuses ({university.campuses.length})
                    </TabLink>
                    {can(actor, PERMISSIONS.UNIVERSITY_THEME_EDIT, {
                      universityId: university.id,
                    }) ? (
                      <TabLink href={`/admin/universities/${university.id}/theme`}>Theme</TabLink>
                    ) : null}
                  </div>
                </div>

                {can(actor, PERMISSIONS.UNIVERSITY_LINKS_MANAGE, {
                  universityId: university.id,
                }) ? (
                  <div className="mt-5 border-t border-hairline pt-5">
                    <h3 className="text-sm font-bold text-content">Official website</h3>
                    <p className="mt-1 mb-3 text-xs text-content-muted">
                      {university.officialWebsiteVerifiedAt
                        ? `Confirmed on ${formatDate(university.officialWebsiteVerifiedAt)}.`
                        : 'Visitors are told this link is awaiting confirmation until you confirm it.'}
                    </p>
                    <OfficialWebsiteForm
                      universityId={university.id}
                      officialWebsite={university.officialWebsite ?? ''}
                      isConfirmed={Boolean(university.officialWebsiteVerifiedAt)}
                    />
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TabLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-hairline px-3.5 py-1.5 text-xs font-bold text-content transition-colors hover:border-brand hover:text-brand"
    >
      {children}
    </Link>
  )
}
