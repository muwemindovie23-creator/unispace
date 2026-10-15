// Loads .env before the Prisma client reads DATABASE_URL. The Prisma CLI does
// this automatically; a plain tsx script does not.
import 'dotenv/config'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PrismaClient } from '@prisma/client'

import { SYSTEM_ROLES } from '../src/lib/rbac/permissions'
import { SETTING_DESCRIPTIONS, SETTING_KEYS } from '../src/lib/settings.keys'
import { DEFAULT_SECTION_ORDER } from '../src/modules/universities/sections'
import {
  INITIAL_AD_PLACEMENTS,
  INITIAL_TAXONOMY,
  INITIAL_UNIVERSITIES,
} from './seed-data'

/**
 * Idempotent seed. Safe to re-run: it upserts reference data and never
 * overwrites content an administrator has edited.
 *
 * It deliberately creates NO administrator account. The first Super Admin is
 * provisioned separately — see `npm run provision:super-admin` — so that no
 * default credential ever exists in source control.
 */
const db = new PrismaClient()

async function seedRoles() {
  for (const role of Object.values(SYSTEM_ROLES)) {
    await db.adminRole.upsert({
      where: { key: role.key },
      // System roles are kept in step with the code catalogue on every deploy.
      update: {
        name: role.name,
        description: role.description,
        allowedScopes: [...role.allowedScopes],
        permissions: [...role.permissions],
        isSystem: true,
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        allowedScopes: [...role.allowedScopes],
        permissions: [...role.permissions],
        isSystem: true,
      },
    })
  }
  console.log(`  roles:          ${Object.keys(SYSTEM_ROLES).length} system roles`)
}

async function seedSettings() {
  for (const key of Object.values(SETTING_KEYS)) {
    await db.platformSetting.upsert({
      where: { key },
      // Never clobber a value an administrator has configured.
      update: { description: SETTING_DESCRIPTIONS[key] },
      create: {
        key,
        // Contact addresses are intentionally empty: inventing one would put a
        // non-working address on a published legal page.
        value: key === SETTING_KEYS.LEGAL_REVIEW_STATUS ? 'pending' : '',
        description: SETTING_DESCRIPTIONS[key],
      },
    })
  }
  console.log(`  settings:       ${Object.values(SETTING_KEYS).length} keys`)
}

async function seedLegalDocuments() {
  const documents = [
    {
      kind: 'PRIVACY_POLICY' as const,
      slug: 'privacy',
      title: 'Privacy Policy',
      file: 'privacy-policy.md',
    },
    {
      kind: 'TERMS_OF_USE' as const,
      slug: 'terms',
      title: 'Terms of Use',
      file: 'terms-of-use.md',
    },
  ]

  for (const config of documents) {
    const body = readFileSync(join(__dirname, 'legal', config.file), 'utf8')

    const document = await db.legalDocument.upsert({
      where: { kind: config.kind },
      update: {},
      create: { kind: config.kind, slug: config.slug, title: config.title },
    })

    const existing = await db.legalDocumentVersion.findUnique({
      where: { documentId_version: { documentId: document.id, version: 1 } },
    })

    // Only ever create version 1. Later versions are authored in the dashboard,
    // and re-running the seed must not overwrite published legal text.
    if (!existing) {
      const now = new Date()
      const version = await db.legalDocumentVersion.create({
        data: {
          documentId: document.id,
          version: 1,
          title: config.title,
          body,
          status: 'PUBLISHED',
          effectiveAt: now,
          publishedAt: now,
          summaryOfChanges: 'Initial version seeded with the platform.',
        },
      })

      await db.legalDocument.update({
        where: { id: document.id },
        data: { publishedVersionId: version.id },
      })
    }
  }
  console.log(`  legal:          ${documents.length} documents (version 1 published)`)
}

async function seedTaxonomy() {
  let count = 0
  for (const group of INITIAL_TAXONOMY) {
    for (const [index, term] of group.terms.entries()) {
      // Not an upsert: these rows have a NULL universityId (platform-wide), and
      // Prisma cannot address a compound unique key that contains a NULL.
      const existing = await db.taxonomyTerm.findFirst({
        where: { kind: group.kind, universityId: null, slug: term.slug },
        select: { id: true },
      })

      if (existing) {
        await db.taxonomyTerm.update({
          where: { id: existing.id },
          data: { label: term.label, displayOrder: index },
        })
      } else {
        await db.taxonomyTerm.create({
          data: {
            kind: group.kind,
            slug: term.slug,
            label: term.label,
            displayOrder: index,
          },
        })
      }
      count += 1
    }
  }
  console.log(`  taxonomy:       ${count} platform-wide categories`)
}

async function seedUniversities() {
  for (const seed of INITIAL_UNIVERSITIES) {
    const university = await db.university.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        acronym: seed.acronym,
        displayOrder: seed.displayOrder,
      },
      create: {
        slug: seed.slug,
        name: seed.name,
        acronym: seed.acronym,
        shortDescription: seed.shortDescription,
        officialWebsite: seed.officialWebsite,
        // Left null on purpose: an administrator confirms the link in the
        // dashboard, and only then does the public page show it as confirmed.
        officialWebsiteVerifiedAt: null,
        country: 'Malawi',
        // No campuses are asserted, so no profile is complete at seed time.
        profileStatus: 'IN_PROGRESS',
        isPublished: true,
        displayOrder: seed.displayOrder,
      },
    })

    // Published theme, plus a draft copy for the theme editor to work against.
    for (const variant of ['PUBLISHED', 'DRAFT'] as const) {
      await db.universityTheme.upsert({
        where: { universityId_variant: { universityId: university.id, variant } },
        update: {},
        create: {
          universityId: university.id,
          variant,
          ...seed.theme,
          sourceNote: seed.themeSourceNote,
        },
      })
    }

    for (const [index, sectionKey] of DEFAULT_SECTION_ORDER.entries()) {
      // University-wide rows have a NULL campusId, so this is a find-then-create
      // rather than an upsert on the compound key.
      const existing = await db.universityHomepageSection.findFirst({
        where: { universityId: university.id, campusId: null, sectionKey },
        select: { id: true },
      })

      if (!existing) {
        await db.universityHomepageSection.create({
          data: {
            universityId: university.id,
            sectionKey,
            isEnabled: true,
            displayOrder: index,
          },
        })
      }
    }
  }

  console.log(`  universities:   ${INITIAL_UNIVERSITIES.length} published, 0 campuses asserted`)
}

async function seedAdPlacements() {
  for (const [index, placement] of INITIAL_AD_PLACEMENTS.entries()) {
    await db.advertisingPlacement.upsert({
      where: { key: placement.key },
      update: { name: placement.name, description: placement.description },
      create: {
        key: placement.key,
        name: placement.name,
        description: placement.description,
        // Nothing is on sale until a Super Admin says so.
        isAvailable: false,
        displayOrder: index,
      },
    })
  }
  console.log(`  ad placements:  ${INITIAL_AD_PLACEMENTS.length} (all unavailable until enabled)`)
}

async function main() {
  console.log('Seeding UniSpace reference data…')
  await seedRoles()
  await seedSettings()
  await seedLegalDocuments()
  await seedTaxonomy()
  await seedUniversities()
  await seedAdPlacements()
  console.log('\nDone. No administrator account was created.')
  console.log('Provision the first Super Admin with:  npm run provision:super-admin')
  console.log('Then set the contact addresses in the dashboard under platform settings.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
