import { SettingsForm } from '@/components/admin/settings-form'
import { SectionHeading } from '@/components/ui/primitives'
import { listSettings } from '@/lib/settings'
import { requirePermission } from '@/modules/admin/guard'
import { PERMISSIONS } from '@/modules/admin/rbac'

export default async function AdminSettingsPage() {
  await requirePermission(PERMISSIONS.PLATFORM_SETTINGS_MANAGE)
  const settings = await listSettings()

  return (
    <div className="max-w-2xl space-y-7">
      <SectionHeading
        title="Platform settings"
        description="Contact addresses are read from here everywhere they appear, including the Privacy Policy and Terms of Use. They stay empty until you set them, rather than defaulting to an address that does not work."
      />
      <SettingsForm settings={settings} />
    </div>
  )
}
