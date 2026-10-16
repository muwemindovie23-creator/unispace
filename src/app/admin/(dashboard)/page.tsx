import { AlertTriangle, Building2, CheckCircle2, Globe2 } from 'lucide-react'
import Link from 'next/link'

import { Badge, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { getSettings, SETTING_KEYS } from '@/lib/settings'
import { formatDateTime } from '@/lib/utils'
import { requireActor } from '@/modules/admin/guard'
import { listManageableUniversities, listRecentAudit } from '@/modules/admin/queries'
import { can, PERMISSIONS, visibleUniverseOf } from '@/modules/admin/rbac'

export default async function AdminOverviewPage() {
  const actor = await requireActor()
  const scope = visibleUniverseOf(actor)

  const [universities, settings, recentAudit, unpublishedVerified, pendingApplications] =
    await Promise.all([
    listManageableUniversities(actor),
    can(actor, PERMISSIONS.PLATFORM_SETTINGS_MANAGE)
      ? getSettings([
          SETTING_KEYS.CONTACT_GENERAL_EMAIL,
          SETTING_KEYS.CONTACT_PRIVACY_EMAIL,
          SETTING_KEYS.CONTACT_LEGAL_EMAIL,
          SETTING_KEYS.PLATFORM_OPERATOR_NAME,
          SETTING_KEYS.LEGAL_REVIEW_STATUS,
        ])
      : Promise.resolve(null),
    can(actor, PERMISSIONS.PLATFORM_AUDIT_READ) ? listRecentAudit(8) : Promise.resolve([]),
    // Verified businesses that are not public yet. Easy to create and then
    // forget, so the dashboard says so rather than leaving them stranded.
    can(actor, PERMISSIONS.BUSINESS_READ)
      ? db.campusBusiness.count({
          where: { verificationStatus: 'VERIFIED', status: { not: 'PUBLISHED' } },
        })
      : Promise.resolve(0),
    can(actor, PERMISSIONS.BUSINESS_APPLICATION_READ)
      ? db.businessApplication.count({ where: { status: 'PENDING' } })
      : Promise.resolve(0),
  ])

  const unconfiguredSettings = settings
    ? Object.entries(settings).filter(([key, value]) => {
        if (key === SETTING_KEYS.LEGAL_REVIEW_STATUS) return false
        return !value
      })
    : []

  const unconfirmedWebsites = universities.filter(
    (university) => !university.officialWebsiteVerifiedAt,
  )

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-content">
          Welcome back, {actor.name.split(' ')[0]}
        </h1>
        <p className="mt-1.5 text-sm text-content-muted">
          {scope.isPlatformWide
            ? 'You have platform-wide access across every university and campus.'
            : 'You can manage the universities and campuses assigned to you below.'}
        </p>
      </div>

      {/* ------------------------------------------------ Things needing action */}
      {(unconfiguredSettings.length > 0 ||
        unconfirmedWebsites.length > 0 ||
        unpublishedVerified > 0 ||
        pendingApplications > 0 ||
        settings?.[SETTING_KEYS.LEGAL_REVIEW_STATUS] === 'pending') && (
        <section>
          <SectionHeading
            title="Needs your attention"
            description="Set-up steps that are deliberately left for a person to complete, rather than guessed by the platform."
            className="mb-5"
          />
          <ul className="grid gap-3 md:grid-cols-2">
            {unpublishedVerified > 0 ? (
              <li>
                <ActionCard
                  tone="caution"
                  title={`${unpublishedVerified} verified business${
                    unpublishedVerified === 1 ? '' : 'es'
                  } not published`}
                  description="These passed verification but are still drafts, so students cannot see them in the directory. Review the copy and publish."
                  href="/admin/businesses/applications"
                  cta="Publish them"
                />
              </li>
            ) : null}

            {pendingApplications > 0 ? (
              <li>
                <ActionCard
                  tone="caution"
                  title={`${pendingApplications} business application${
                    pendingApplications === 1 ? '' : 's'
                  } waiting`}
                  description="Businesses have applied to be listed and are waiting for someone to check them."
                  href="/admin/businesses/applications"
                  cta="Open the queue"
                />
              </li>
            ) : null}

            {unconfiguredSettings.length > 0 ? (
              <li>
                <ActionCard
                  tone="caution"
                  title={`${unconfiguredSettings.length} contact details not configured`}
                  description="Legal pages and contact routes reference these addresses. Until they are set, those pages say so rather than showing an address that does not work."
                  href="/admin/settings"
                  cta="Configure settings"
                />
              </li>
            ) : null}

            {settings?.[SETTING_KEYS.LEGAL_REVIEW_STATUS] === 'pending' ? (
              <li>
                <ActionCard
                  tone="caution"
                  title="Legal documents awaiting independent review"
                  description="The Privacy Policy and Terms of Use describe what UniSpace actually does, but have not been reviewed by a legal practitioner. Visitors see a notice saying so."
                  href="/admin/legal"
                  cta="Review legal documents"
                />
              </li>
            ) : null}

            {unconfirmedWebsites.length > 0 ? (
              <li>
                <ActionCard
                  tone="caution"
                  title={`${unconfirmedWebsites.length} official website${
                    unconfirmedWebsites.length === 1 ? '' : 's'
                  } unconfirmed`}
                  description="A link is only shown to visitors as confirmed once an administrator has checked that it resolves to the university's own site."
                  href="/admin/universities"
                  cta="Confirm official links"
                />
              </li>
            ) : null}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------- Your scope */}
      <section>
        <SectionHeading
          title="Your universities"
          description="Content you publish is scoped to these universities and campuses."
          className="mb-5"
        />

        {universities.length === 0 ? (
          <EmptyState
            title="No universities assigned to you yet"
            description="A Super Admin assigns administrators to a university or to specific campuses. Until then there is nothing here to manage."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {universities.map((university) => (
              <li key={university.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-content">{university.acronym}</h3>
                      <p className="text-xs text-content-muted">{university.name}</p>
                    </div>
                    <Badge tone={university.isPublished ? 'positive' : 'muted'}>
                      {university.isPublished ? 'Published' : 'Unpublished'}
                    </Badge>
                  </div>

                  <dl className="mt-4 space-y-1.5 text-xs text-content-muted">
                    <div className="flex items-center gap-1.5">
                      <Building2 aria-hidden className="h-3.5 w-3.5" />
                      <dt className="sr-only">Campuses</dt>
                      <dd>
                        {university.campuses.length === 0
                          ? 'No campuses added yet'
                          : `${university.campuses.length} campus${
                              university.campuses.length === 1 ? '' : 'es'
                            } in your scope`}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe2 aria-hidden className="h-3.5 w-3.5" />
                      <dt className="sr-only">Official website</dt>
                      <dd>
                        {university.officialWebsiteVerifiedAt
                          ? 'Official link confirmed'
                          : university.officialWebsite
                            ? 'Official link awaiting confirmation'
                            : 'No official link recorded'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex gap-3 text-xs font-semibold">
                    <Link href={`/admin/universities`} className="text-brand hover:underline">
                      Manage
                    </Link>
                    {university.isPublished ? (
                      <Link
                        href={`/universities/${university.slug}`}
                        className="text-content-muted hover:text-brand"
                      >
                        View public page
                      </Link>
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* -------------------------------------------------------- Audit trail */}
      {can(actor, PERMISSIONS.PLATFORM_AUDIT_READ) ? (
        <section>
          <SectionHeading
            title="Recent administrative activity"
            description="Role changes, publishing decisions and verification outcomes are recorded here."
            className="mb-5"
          />

          {recentAudit.length === 0 ? (
            <EmptyState
              title="No recorded activity yet"
              description="Sensitive administrative actions appear here as soon as they happen."
            />
          ) : (
            <Card className="divide-y divide-hairline p-0">
              {recentAudit.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-content">{entry.action}</p>
                    <p className="truncate text-xs text-content-muted">
                      {entry.actorEmail ?? 'system'}
                      {entry.targetType ? ` · ${entry.targetType}` : ''}
                    </p>
                  </div>
                  <time
                    dateTime={entry.createdAt.toISOString()}
                    className="shrink-0 text-xs text-content-muted"
                  >
                    {formatDateTime(entry.createdAt)}
                  </time>
                </div>
              ))}
            </Card>
          )}
        </section>
      ) : null}
    </div>
  )
}

function ActionCard({
  tone,
  title,
  description,
  href,
  cta,
}: {
  tone: 'caution' | 'positive'
  title: string
  description: string
  href: string
  cta: string
}) {
  const Icon = tone === 'caution' ? AlertTriangle : CheckCircle2

  return (
    <Card className="h-full">
      <div className="flex gap-3">
        <Icon
          aria-hidden
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            tone === 'caution' ? 'text-amber-600' : 'text-emerald-600'
          }`}
        />
        <div>
          <h3 className="text-sm font-bold text-content">{title}</h3>
          <p className="mt-1 text-sm text-content-muted">{description}</p>
          <Link
            href={href}
            className="mt-3 inline-block text-xs font-bold text-brand hover:underline"
          >
            {cta} →
          </Link>
        </div>
      </div>
    </Card>
  )
}
