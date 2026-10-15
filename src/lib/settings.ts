import 'server-only'

import { db } from '@/lib/db'
import { SETTING_KEYS, type SettingKey } from '@/lib/settings.keys'

export { SETTING_KEYS, SETTING_DESCRIPTIONS } from '@/lib/settings.keys'
export type { SettingKey } from '@/lib/settings.keys'

/** Returns the stored value, or null when it has not been configured yet. */
export async function getSetting(key: SettingKey): Promise<string | null> {
  const row = await db.platformSetting.findUnique({ where: { key } })
  const value = row?.value?.trim()
  return value ? value : null
}

export async function getSettings(keys: SettingKey[]): Promise<Record<string, string | null>> {
  const rows = await db.platformSetting.findMany({ where: { key: { in: keys } } })
  const result: Record<string, string | null> = {}
  for (const key of keys) {
    const value = rows.find((row) => row.key === key)?.value?.trim()
    result[key] = value ? value : null
  }
  return result
}

/** Every configurable setting with its current value, for the settings screen. */
export async function listSettings() {
  const rows = await db.platformSetting.findMany({ orderBy: { key: 'asc' } })
  return Object.values(SETTING_KEYS).map((key) => ({
    key,
    value: rows.find((row) => row.key === key)?.value ?? '',
    description: rows.find((row) => row.key === key)?.description ?? '',
  }))
}
