import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lowercase, hyphenated, URL-safe. Used for university and content slugs. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ''
  return DATE_FORMAT.format(typeof value === 'string' ? new Date(value) : value)
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return ''
  return DATE_TIME_FORMAT.format(typeof value === 'string' ? new Date(value) : value)
}

/**
 * Only http(s) links are ever rendered. Anything else (javascript:, data:) is
 * dropped — external links come from admin input and public submissions.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function hostnameOf(value: string | null | undefined): string | null {
  const safe = safeExternalUrl(value)
  if (!safe) return null
  return new URL(safe).hostname.replace(/^www\./, '')
}
