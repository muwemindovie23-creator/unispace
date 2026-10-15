import 'server-only'

import { headers } from 'next/headers'

import { ipHint } from '@/lib/auth/tokens'
import { db } from '@/lib/db'
import { getEnv } from '@/lib/env'

/**
 * Audit logging for sensitive administrative actions: role changes, publishing,
 * verification decisions, moderation overrides and legal publication.
 *
 * Deliberately never records passwords, tokens, session identifiers, raw IP
 * addresses or personal data that is not needed to understand what changed.
 */
export interface AuditEntry {
  actorId?: string | null
  actorEmail?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  universityId?: string | null
  campusId?: string | null
  /** A short before/after summary. Keep it small and free of secrets. */
  metadata?: Record<string, unknown> | null
}

const FORBIDDEN_METADATA_KEYS = [
  'password',
  'passwordhash',
  'token',
  'tokenhash',
  'csrfsecret',
  'secret',
  'authorization',
  'cookie',
]

function scrubMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return undefined

  const safe: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.some((forbidden) => key.toLowerCase().includes(forbidden))) {
      safe[key] = '[redacted]'
      continue
    }
    safe[key] = value
  }
  return safe
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  let hint: string | null = null
  try {
    const requestHeaders = await headers()
    const forwardedFor = requestHeaders.get('x-forwarded-for')
    hint = ipHint(getEnv().AUTH_SECRET, forwardedFor?.split(',')[0]?.trim() ?? null)
  } catch {
    // Called outside a request (a CLI script); an IP hint does not apply.
  }

  try {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        universityId: entry.universityId ?? null,
        campusId: entry.campusId ?? null,
        metadata: scrubMetadata(entry.metadata) as never,
        ipHint: hint,
      },
    })
  } catch (error) {
    // An audit failure must never take down the action it was recording, but it
    // must be visible in the logs.
    console.error('Failed to write audit log entry', entry.action, error)
  }
}
