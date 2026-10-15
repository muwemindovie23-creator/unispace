import Link from 'next/link'

import { UniversityForm } from '@/components/admin/university-form'
import { Card, SectionHeading } from '@/components/ui/primitives'
import { requirePermission } from '@/modules/admin/guard'
import { can, PERMISSIONS } from '@/modules/admin/rbac'

export const metadata = { title: 'Add a university' }

export default async function NewUniversityPage() {
  const actor = await requirePermission(PERMISSIONS.UNIVERSITY_CREATE)

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <Link
          href="/admin/universities"
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← Universities
        </Link>
        <SectionHeading
          title="Add a university"
          description="Creating a university needs no code change and no deployment. It starts unpublished with the UniSpace default theme, which you can then edit."
          className="mt-3"
        />
      </div>

      <Card className="bg-highlight/60">
        <h2 className="text-sm font-bold text-content">Before you publish</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-content-muted">
          <li>Add the campuses you can actually confirm — a missing campus beats a wrong one.</li>
          <li>Record and confirm the official website, so visitors see it as checked.</li>
          <li>Set the theme from the institution’s real brand guideline where you have it.</li>
        </ul>
      </Card>

      <UniversityForm canPublish={can(actor, PERMISSIONS.UNIVERSITY_PUBLISH)} />
    </div>
  )
}
