import { z } from 'zod'

/**
 * Server-side environment. Validated once at import time so a missing secret
 * fails loudly at boot instead of silently weakening security at runtime.
 *
 * Never import this from a client component.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /** Neon pooled connection string used by the running app. */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /** Neon direct (non-pooled) connection string used by Prisma Migrate. */
  DIRECT_DATABASE_URL: z.string().min(1).optional(),

  /**
   * 32+ byte random secret. Used to key session-cookie signing, the CSRF
   * double-submit tokens and the anonymous poll ballot hash. Rotating it signs
   * every administrator out and resets anonymous vote identifiers.
   */
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

  /** Public origin, used for absolute URLs, cookies and origin checking. */
  APP_URL: z.string().url().default('http://localhost:3000'),
})

export type ServerEnv = z.infer<typeof serverSchema>

let cached: ServerEnv | null = null

export function getEnv(): ServerEnv {
  if (cached) return cached

  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nSee .env.example and docs/deployment.md.`,
    )
  }

  cached = parsed.data
  return cached
}

export const isProduction = () => getEnv().NODE_ENV === 'production'
