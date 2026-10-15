import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ThemeEditor } from '@/components/admin/theme-editor'
import { SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { DEFAULT_THEME, type ThemeTokens } from '@/lib/theme/tokens'
import { requirePermission } from '@/modules/admin/guard'
import { PERMISSIONS } from '@/modules/admin/rbac'

const THEME_FIELDS = {
  primaryColor: true,
  primaryContrast: true,
  secondaryColor: true,
  secondaryContrast: true,
  accentColor: true,
  accentContrast: true,
  backgroundColor: true,
  surfaceColor: true,
  surfaceMutedColor: true,
  textPrimaryColor: true,
  textSecondaryColor: true,
  borderColor: true,
  highlightColor: true,
  radius: true,
  decorativePatternUrl: true,
  sourceNote: true,
} as const

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Scope is checked before anything about the university is loaded.
  await requirePermission(PERMISSIONS.UNIVERSITY_THEME_EDIT, { universityId: id })

  const university = await db.university.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      acronym: true,
      slug: true,
      themes: { select: { variant: true, ...THEME_FIELDS } },
    },
  })

  if (!university) notFound()

  const draft = university.themes.find((theme) => theme.variant === 'DRAFT')
  const published = university.themes.find((theme) => theme.variant === 'PUBLISHED')
  const starting = draft ?? published

  const { sourceNote, decorativePatternUrl: _pattern, variant: _variant, ...tokens } =
    starting ?? { ...DEFAULT_THEME, sourceNote: null, decorativePatternUrl: null, variant: 'DRAFT' as const }

  // Whether the draft differs from what visitors currently see. This is shown
  // as a persistent status rather than a flash message, because publishing
  // revalidates the router and would discard a transient one.
  const hasUnpublishedChanges =
    published === undefined ||
    draft === undefined ||
    (Object.keys(tokens) as (keyof typeof tokens)[]).some(
      (key) => draft[key as keyof typeof draft] !== published[key as keyof typeof published],
    )

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/admin/universities"
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← Universities
        </Link>
        <SectionHeading
          eyebrow={university.acronym}
          title="Theme"
          description="Edit the draft, check it in the live preview, then publish. Visitors keep seeing the published theme until you do."
          className="mt-3"
        />
      </div>

      <ThemeEditor
        universityId={university.id}
        universityName={university.name}
        acronym={university.acronym}
        draft={tokens as ThemeTokens}
        sourceNote={sourceNote ?? null}
        hasPublished={Boolean(published)}
        hasUnpublishedChanges={hasUnpublishedChanges}
      />
    </div>
  )
}
