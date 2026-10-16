import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/primitives'
import { signOutAction } from '@/modules/admin/auth-actions'
import { requireActor } from '@/modules/admin/guard'
import { can, PERMISSIONS, visibleUniverseOf } from '@/modules/admin/rbac'

// Every dashboard page reads the signed-in administrator, so none of this can
// be statically rendered or cached.
export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/admin', label: 'Overview', permission: null },
  { href: '/admin/universities', label: 'Universities', permission: PERMISSIONS.UNIVERSITY_UPDATE },
  { href: '/admin/businesses/applications', label: 'Verification queue', permission: PERMISSIONS.BUSINESS_APPLICATION_READ },
  { href: '/admin/advertising', label: 'Advertising', permission: PERMISSIONS.ADVERTISING_ENQUIRY_READ },
  { href: '/admin/administrators', label: 'Administrators', permission: PERMISSIONS.ADMIN_READ },
  { href: '/admin/legal', label: 'Legal documents', permission: PERMISSIONS.LEGAL_READ },
  { href: '/admin/settings', label: 'Settings', permission: PERMISSIONS.PLATFORM_SETTINGS_MANAGE },
  { href: '/admin/audit', label: 'Audit log', permission: PERMISSIONS.PLATFORM_AUDIT_READ },
] as const

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor()
  const scope = visibleUniverseOf(actor)

  // The nav is filtered for usability. The permission is checked again inside
  // every page and action — hiding a link is not the control.
  const navItems = NAV.filter((item) => item.permission === null || can(actor, item.permission))

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-hairline bg-surface">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-xs font-black text-brand-contrast"
              >
                US
              </span>
              <span className="text-sm font-extrabold tracking-tight text-content">
                UniSpace admin
              </span>
            </Link>
            <span className="hidden rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-content-muted sm:inline">
              {scope.isPlatformWide
                ? 'Platform-wide access'
                : `${scope.universityIds.length} university · ${scope.campusIds.length} campus assignments`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-xs font-semibold text-content-muted hover:text-brand sm:inline"
            >
              View public site
            </Link>
            <span className="hidden text-sm font-semibold text-content md:inline">
              {actor.name}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </Container>

        <nav aria-label="Dashboard" className="border-t border-hairline">
          <Container className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex min-w-max items-center gap-1 py-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold text-content-muted transition-colors hover:bg-highlight hover:text-content"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      </header>

      <main id="main" className="py-8">
        <Container>{children}</Container>
      </main>
    </div>
  )
}
