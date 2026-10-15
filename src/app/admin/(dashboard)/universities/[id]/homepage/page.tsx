import Link from 'next/link'
import { notFound } from 'next/navigation'

import { HomepageSectionsForm, type SectionRow } from '@/components/admin/homepage-sections-form'
import { Card, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { requirePermission } from '@/modules/admin/guard'
import { PERMISSIONS } from '@/modules/admin/rbac'
import { DEFAULT_SECTION_ORDER, HOMEPAGE_SECTIONS } from '@/modules/universities/sections'

/**
 * `?campus=<id>` configures that campus's homepage; without it the page
 * configures the university-wide homepage.
 */
export default async function HomepageLayoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ campus?: string }>
}) {
  const { id } = await params
  const { campus: campusParam } = await searchParams

  const university = await db.university.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      acronym: true,
      slug: true,
      campuses: {
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true },
      },
    },
  })
  if (!university) notFound()

  const campus = campusParam
    ? university.campuses.find((row) => row.id === campusParam)
    : undefined
  if (campusParam && !campus) notFound()

  await requirePermission(PERMISSIONS.UNIVERSITY_HOMEPAGE_MANAGE, {
    universityId: university.id,
    campusId: campus?.id ?? null,
  })

  const stored = await db.universityHomepageSection.findMany({
    where: { universityId: university.id, campusId: campus?.id ?? null },
    orderBy: { displayOrder: 'asc' },
    select: { sectionKey: true, isEnabled: true, displayOrder: true, updatedAt: true },
  })

  // Read from the database on every load, so it survives the router refresh
  // that saving triggers and acts as the real confirmation.
  const lastSavedAt = stored.reduce<Date | null>(
    (latest, row) => (latest === null || row.updatedAt > latest ? row.updatedAt : latest),
    null,
  )

  // Stored order first, then any section the registry has gained since.
  const storedKeys = stored.map((row) => row.sectionKey)
  const orderedKeys = [
    ...storedKeys.filter((key): key is keyof typeof HOMEPAGE_SECTIONS => key in HOMEPAGE_SECTIONS),
    ...DEFAULT_SECTION_ORDER.filter((key) => !storedKeys.includes(key)),
  ]

  const rows: SectionRow[] = orderedKeys.map((key) => {
    const section = HOMEPAGE_SECTIONS[key]
    const row = stored.find((entry) => entry.sectionKey === key)
    return {
      key,
      label: section.label,
      description: section.description,
      // A campus with no stored configuration starts from everything enabled,
      // matching the inheritance the public page applies.
      isEnabled: row?.isEnabled ?? true,
    }
  })

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link
          href={`/admin/universities/${university.id}`}
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← {university.acronym}
        </Link>
        <SectionHeading
          eyebrow={campus ? `${university.acronym} · ${campus.name}` : university.acronym}
          title="Homepage layout"
          description="Choose which sections appear and in what order. Turning a section off hides it from visitors; it does not delete anything."
          className="mt-3"
        />
      </div>

      {university.campuses.length > 0 ? (
        <Card className="bg-surface-muted/60">
          <h2 className="text-sm font-bold text-content">Configuring</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            <ScopeChip
              href={`/admin/universities/${university.id}/homepage`}
              isActive={!campus}
            >
              University-wide
            </ScopeChip>
            {university.campuses.map((row) => (
              <ScopeChip
                key={row.id}
                href={`/admin/universities/${university.id}/homepage?campus=${row.id}`}
                isActive={campus?.id === row.id}
              >
                {row.name}
              </ScopeChip>
            ))}
          </ul>
          <p className="mt-3 text-xs text-content-muted">
            A campus with no layout of its own inherits the university-wide one.
          </p>
        </Card>
      ) : null}

      <HomepageSectionsForm
        universityId={university.id}
        campusId={campus?.id}
        sections={rows}
        lastSavedLabel={
          lastSavedAt
            ? `Last saved ${formatDateTime(lastSavedAt)}`
            : 'Not configured yet — showing the platform default'
        }
      />
    </div>
  )
}

function ScopeChip({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={`inline-block rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
          isActive
            ? 'border-brand bg-brand text-brand-contrast'
            : 'border-hairline bg-surface text-content-muted hover:border-brand hover:text-content'
        }`}
      >
        {children}
      </Link>
    </li>
  )
}
