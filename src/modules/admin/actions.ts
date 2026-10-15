'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { recordAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import { SETTING_KEYS, type SettingKey } from '@/lib/settings.keys'
import { auditThemeContrast, type ThemeTokens } from '@/lib/theme/tokens'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, PERMISSIONS } from '@/modules/admin/rbac'

export interface ActionState {
  error?: string
  success?: string
}

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex colour such as #1d4ed8')

const themeSchema = z.object({
  primaryColor: hexColor,
  primaryContrast: hexColor,
  secondaryColor: hexColor,
  secondaryContrast: hexColor,
  accentColor: hexColor,
  accentContrast: hexColor,
  backgroundColor: hexColor,
  surfaceColor: hexColor,
  surfaceMutedColor: hexColor,
  textPrimaryColor: hexColor,
  textSecondaryColor: hexColor,
  borderColor: hexColor,
  highlightColor: hexColor,
  radius: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?(rem|px)$/, 'Use a radius such as 1.25rem'),
  sourceNote: z.string().trim().max(500).optional().or(z.literal('')),
})

function readTheme(formData: FormData) {
  return themeSchema.safeParse(Object.fromEntries(formData.entries()))
}

/** Saves the DRAFT theme. Visitors keep seeing the published one. */
export async function saveDraftThemeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const universityId = String(formData.get('universityId') ?? '')
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.UNIVERSITY_THEME_EDIT, { universityId })

  const parsed = readTheme(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the colours and try again.' }
  }

  const university = await db.university.findUnique({
    where: { id: universityId },
    select: { id: true, acronym: true },
  })
  if (!university) return { error: 'That university no longer exists.' }

  const { sourceNote, ...tokens } = parsed.data

  await db.universityTheme.upsert({
    where: { universityId_variant: { universityId, variant: 'DRAFT' } },
    update: { ...tokens, sourceNote: sourceNote || null },
    create: { universityId, variant: 'DRAFT', ...tokens, sourceNote: sourceNote || null },
  })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'theme.draft_saved',
    targetType: 'UniversityTheme',
    targetId: universityId,
    universityId,
    metadata: { acronym: university.acronym, primaryColor: tokens.primaryColor },
  })

  // No revalidatePath here: the dashboard is force-dynamic, so there is nothing
  // cached to revalidate, and refreshing the router would remount the editor and
  // discard the confirmation message the administrator needs to see. Only
  // publishing touches cached public pages.
  return { success: 'Draft saved. Visitors still see the published theme.' }
}

/**
 * Publishes the draft. Refuses while any text/background pairing fails WCAG AA,
 * so a brand colour cannot quietly make a university's pages unreadable.
 */
export async function publishThemeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const universityId = String(formData.get('universityId') ?? '')
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.UNIVERSITY_THEME_PUBLISH, { universityId })

  const [university, draft] = await Promise.all([
    db.university.findUnique({ where: { id: universityId }, select: { slug: true, acronym: true } }),
    db.universityTheme.findUnique({
      where: { universityId_variant: { universityId, variant: 'DRAFT' } },
    }),
  ])

  if (!university) return { error: 'That university no longer exists.' }
  if (!draft) return { error: 'There is no draft to publish. Save a draft first.' }

  const failures = auditThemeContrast(draft as unknown as ThemeTokens).filter(
    (finding) => !finding.passes,
  )
  if (failures.length > 0) {
    return {
      error: `Cannot publish: ${failures
        .map((finding) => `${finding.pair} (${finding.ratio ?? 'unreadable'}:1, needs ${finding.required}:1)`)
        .join('; ')}.`,
    }
  }

  const {
    id: _id,
    universityId: _universityId,
    variant: _variant,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...tokens
  } = draft

  await db.universityTheme.upsert({
    where: { universityId_variant: { universityId, variant: 'PUBLISHED' } },
    update: tokens,
    create: { universityId, variant: 'PUBLISHED', ...tokens },
  })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'theme.published',
    targetType: 'UniversityTheme',
    targetId: universityId,
    universityId,
    metadata: { acronym: university.acronym },
  })

  // Publishing changes what visitors see, so the cached public pages must go.
  revalidatePath('/')
  revalidatePath(`/universities/${university.slug}`)

  return { success: `Theme published. ${university.acronym} pages now use these colours.` }
}

const settingsSchema = z.record(z.string(), z.string().trim().max(300))

const EMAIL_SETTING_KEYS: SettingKey[] = [
  SETTING_KEYS.CONTACT_GENERAL_EMAIL,
  SETTING_KEYS.CONTACT_PRIVACY_EMAIL,
  SETTING_KEYS.CONTACT_LEGAL_EMAIL,
  SETTING_KEYS.CONTACT_ADVERTISING_EMAIL,
  SETTING_KEYS.CONTACT_MODERATION_EMAIL,
]

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.PLATFORM_SETTINGS_MANAGE)

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { error: 'Check the values and try again.' }

  const allowed = new Set<string>(Object.values(SETTING_KEYS))
  const updates = Object.entries(parsed.data).filter(([key]) => allowed.has(key))

  for (const [key, value] of updates) {
    if (EMAIL_SETTING_KEYS.includes(key as SettingKey) && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { error: `"${value}" does not look like an email address.` }
      }
    }
    if (key === SETTING_KEYS.LEGAL_REVIEW_STATUS && value && !['pending', 'reviewed'].includes(value)) {
      return { error: 'Legal review status must be "pending" or "reviewed".' }
    }
  }

  await db.$transaction(
    updates.map(([key, value]) =>
      db.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  )

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'platform.settings_updated',
    targetType: 'PlatformSetting',
    // Keys only — the values can contain contact details.
    metadata: { keys: updates.map(([key]) => key) },
  })

  revalidatePath('/admin/settings')
  revalidatePath('/privacy')
  revalidatePath('/terms')
  return { success: 'Settings saved.' }
}

const officialWebsiteSchema = z.object({
  universityId: z.string().min(1),
  officialWebsite: z
    .string()
    .trim()
    .url('Enter a full URL, including https://')
    .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
      message: 'Only http and https links can be published.',
    })
    .or(z.literal('')),
  confirmed: z.string().optional(),
})

/**
 * Records a university's official website and, when the administrator ticks the
 * confirmation box, marks it as checked. Until then the public page says the
 * link is awaiting confirmation rather than implying it is verified.
 */
export async function saveOfficialWebsiteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = officialWebsiteSchema.safeParse({
    universityId: formData.get('universityId'),
    officialWebsite: formData.get('officialWebsite'),
    confirmed: formData.get('confirmed') ?? undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the link and try again.' }
  }

  const { universityId, officialWebsite, confirmed } = parsed.data
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.UNIVERSITY_LINKS_MANAGE, { universityId })

  const university = await db.university.findUnique({
    where: { id: universityId },
    select: { slug: true, acronym: true, officialWebsite: true },
  })
  if (!university) return { error: 'That university no longer exists.' }

  const isConfirmed = confirmed === 'on' && officialWebsite !== ''

  await db.university.update({
    where: { id: universityId },
    data: {
      officialWebsite: officialWebsite || null,
      officialWebsiteVerifiedAt: isConfirmed ? new Date() : null,
    },
  })

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: isConfirmed ? 'university.official_link_confirmed' : 'university.official_link_updated',
    targetType: 'University',
    targetId: universityId,
    universityId,
    metadata: {
      acronym: university.acronym,
      from: university.officialWebsite,
      to: officialWebsite || null,
    },
  })

  revalidatePath('/admin/universities')
  revalidatePath('/universities/official-websites')
  revalidatePath(`/universities/${university.slug}`)

  return {
    success: isConfirmed
      ? 'Link saved and marked as confirmed.'
      : 'Link saved. It shows as awaiting confirmation until you tick the confirmation box.',
  }
}
