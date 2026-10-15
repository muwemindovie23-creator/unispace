import 'server-only'

import { db } from '@/lib/db'

export type LegalKind =
  | 'PRIVACY_POLICY'
  | 'TERMS_OF_USE'
  | 'MODERATION_POLICY'
  | 'BUSINESS_VERIFICATION_POLICY'
  | 'ADVERTISING_POLICY'

export interface PublishedLegalDocument {
  kind: LegalKind
  slug: string
  title: string
  body: string
  version: number
  effectiveAt: Date | null
  publishedAt: Date | null
  lastUpdatedAt: Date
}

/** The version visitors see. Returns null when nothing has been published yet. */
export async function getPublishedLegalDocument(
  kind: LegalKind,
): Promise<PublishedLegalDocument | null> {
  const document = await db.legalDocument.findUnique({
    where: { kind },
    include: { publishedVersion: true },
  })

  if (!document?.publishedVersion) return null
  const version = document.publishedVersion

  return {
    kind: document.kind,
    slug: document.slug,
    title: version.title,
    body: version.body,
    version: version.version,
    effectiveAt: version.effectiveAt,
    publishedAt: version.publishedAt,
    lastUpdatedAt: version.updatedAt,
  }
}

export async function getPublishedLegalDocumentBySlug(
  slug: string,
): Promise<PublishedLegalDocument | null> {
  const document = await db.legalDocument.findUnique({
    where: { slug },
    include: { publishedVersion: true },
  })

  if (!document?.publishedVersion) return null
  const version = document.publishedVersion

  return {
    kind: document.kind,
    slug: document.slug,
    title: version.title,
    body: version.body,
    version: version.version,
    effectiveAt: version.effectiveAt,
    publishedAt: version.publishedAt,
    lastUpdatedAt: version.updatedAt,
  }
}

/** Prior versions, newest first — kept for administrative reference. */
export async function listLegalVersions(kind: LegalKind) {
  const document = await db.legalDocument.findUnique({
    where: { kind },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          title: true,
          status: true,
          effectiveAt: true,
          publishedAt: true,
          summaryOfChanges: true,
          isMaterialChange: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      },
    },
  })

  return document?.versions ?? []
}
