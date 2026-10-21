import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/ui/primitives'
import { getSetting, SETTING_KEYS } from '@/lib/settings'

const PLATFORM_LINKS = [
  { href: '/', label: 'Explore universities' },
  { href: '/businesses/verify', label: 'Become a Verified Campus Business' },
  { href: '/advertise', label: 'Advertise With Us' },
  { href: '/universities/official-websites', label: 'Official university websites' },
]

const SUPPORT_LINKS = [
  { href: '/contact', label: 'Contact UniSpace' },
  { href: '/report', label: 'Report an issue' },
  { href: '/accessibility', label: 'Accessibility' },
]

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
]

export async function SiteFooter() {
  const operator = await getSetting(SETTING_KEYS.PLATFORM_OPERATOR_NAME)
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-hairline bg-surface">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image src="/logo.png" alt="UniSpace" width={940} height={690} className="h-20 w-auto" />
            
            <p className="mt-2 max-w-xs text-sm text-content-muted">
              One platform. Different campus worlds. One student community.
            </p>
            <p className="mt-4 text-xs text-content-muted">
              UniSpace is an independent student-life platform. It is not operated or endorsed by
              the universities it features.
            </p>
          </div>

          <FooterColumn title="Platform" links={PLATFORM_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-hairline pt-6 text-xs text-content-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {operator ?? 'UniSpace'}. Part of the Menty ecosystem.
          </p>
          <p>
            For admissions, programmes and official announcements, please visit the relevant
            university’s own website.
          </p>
        </div>
      </Container>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-content">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-content-muted transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
