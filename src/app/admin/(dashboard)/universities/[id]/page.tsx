import { Building2, Footprints, LayoutList, Palette, Store } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { UniversityForm } from '@/components/admin/university-form'
import { Badge, Card, SectionHeading } from '@/components/ui/primitives'
import { db } from '@/lib/db'
import { requireActor } from '@/modules/admin/guard'
import { assertCan, can, PERMISSIONS } from '@/modules/admin/rbac'

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const actor = await requireActor()
  assertCan(actor, PERMISSIONS.UNIVERSITY_UPDATE, { universityId: id })

  const university = await db.university.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      acronym: true,
      slug: true,
      shortDescription: true,
      longDescription: true,
      city: true,
      logoUrl: true,
      coverImageUrl: true,
      profileStatus: true,
      isPublished: true,
      displayOrder: true,
      _count: { select: { campuses: true } },
    },
  })
  if (!university) notFound()

  const links = [
    {
      href: `/admin/universities/${university.id}/campuses`,
      icon: Building2,
      label: 'Campuses',
      detail:
        university._count.campuses === 0
          ? 'None yet — add the campuses you can confirm'
          : `${university._count.campuses} campus${university._count.campuses === 1 ? '' : 'es'}`,
      visible: can(actor, PERMISSIONS.CAMPUS_CREATE, { universityId: university.id }),
    },
    {
      href: `/admin/universities/${university.id}/theme`,
      icon: Palette,
      label: 'Theme',
      detail: 'Colours, live preview and contrast check',
      visible: can(actor, PERMISSIONS.UNIVERSITY_THEME_EDIT, { universityId: university.id }),
    },
    {
      href: `/admin/universities/${university.id}/homepage`,
      icon: LayoutList,
      label: 'Homepage layout',
      detail: 'Which sections appear, and in what order',
      visible: can(actor, PERMISSIONS.UNIVERSITY_HOMEPAGE_MANAGE, {
        universityId: university.id,
      }),
    },
    {
      href: `/admin/universities/${university.id}/businesses`,
      icon: Store,
      label: 'Campus businesses',
      detail: 'Listings in the directory and on the map',
      visible: can(actor, PERMISSIONS.BUSINESS_READ, { universityId: university.id }),
    },
    {
      href: `/admin/universities/${university.id}/tour`,
      icon: Footprints,
      label: 'Virtual campus tour',
      detail: 'Mapped stops students walk through',
      visible: can(actor, PERMISSIONS.TOUR_READ, { universityId: university.id }),
    },
  ].filter((link) => link.visible)

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/admin/universities"
          className="text-xs font-semibold text-content-muted hover:text-brand"
        >
          ← Universities
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SectionHeading title={university.name} eyebrow={university.acronym} />
          <Badge tone={university.isPublished ? 'positive' : 'muted'}>
            {university.isPublished ? 'Published' : 'Unpublished'}
          </Badge>
          {university.isPublished ? (
            <Link
              href={`/universities/${university.slug}`}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View public page
            </Link>
          ) : null}
        </div>
      </div>

      {links.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              <Card
                as={Link}
                href={link.href}
                className="block h-full transition-colors hover:border-brand"
              >
                <span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-highlight text-brand">
                  <link.icon aria-hidden className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-sm font-bold text-content">{link.label}</h2>
                <p className="mt-0.5 text-xs text-content-muted">{link.detail}</p>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="max-w-3xl">
        <UniversityForm
          university={{
            id: university.id,
            name: university.name,
            acronym: university.acronym,
            slug: university.slug,
            shortDescription: university.shortDescription,
            longDescription: university.longDescription,
            city: university.city,
            logoUrl: university.logoUrl,
            coverImageUrl: university.coverImageUrl,
            profileStatus: university.profileStatus,
            isPublished: university.isPublished,
            displayOrder: university.displayOrder,
          }}
          canPublish={can(actor, PERMISSIONS.UNIVERSITY_PUBLISH, { universityId: university.id })}
        />
      </div>
    </div>
  )
}
