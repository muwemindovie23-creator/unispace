/**
 * Google Maps embeds, safely.
 *
 * Administrators never supply raw HTML. They supply either a Google Maps embed
 * URL (the one Google's own "Share → Embed a map" dialog produces) or a pair of
 * coordinates, and this module decides what — if anything — may be rendered in
 * an iframe. Anything that is not demonstrably a Google Maps embed is rejected
 * rather than cleaned up, because a half-trusted iframe is still an iframe.
 */

/** Hosts whose /maps/embed paths we are willing to put in an iframe. */
const ALLOWED_EMBED_HOSTS = new Set([
  'www.google.com',
  'google.com',
  'maps.google.com',
  'www.google.co.mw',
  'google.co.mw',
])

export interface MapSource {
  /** An embed URL pasted by an administrator. */
  mapEmbedUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  /** A place name, used only when there are no coordinates. */
  placeQuery?: string | null
}

/**
 * True when the URL is a Google Maps *embed* URL.
 *
 * Google's share dialog gives `https://www.google.com/maps/embed?pb=...`.
 * A normal maps link (`/maps/place/...`) is deliberately rejected: browsers
 * refuse to frame it, so accepting it would show the administrator a blank box
 * and leave them guessing.
 */
export function isAllowedMapEmbedUrl(value: string | null | undefined): boolean {
  if (!value) return false

  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return false
  }

  if (url.protocol !== 'https:') return false
  if (!ALLOWED_EMBED_HOSTS.has(url.hostname.toLowerCase())) return false

  // `/maps/embed` is the official embed path. `/maps` with `output=embed` is
  // the older query form, which Google still serves.
  const path = url.pathname.replace(/\/+$/, '')
  if (path === '/maps/embed') return true
  if ((path === '/maps' || path === '') && url.searchParams.get('output') === 'embed') return true

  return false
}

/**
 * True when the value contains something tag-shaped.
 *
 * Requires a complete `<tag …>` or `</tag>`, not a bare `<`. A business writing
 * "Prices < MK1000" or "delivery < 30 mins" is writing prose, and rejecting it
 * with "remove any HTML tags" would be baffling.
 */
export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-zA-Z][^>]*>/.test(value) || /&lt;\s*\/?\s*[a-zA-Z]/i.test(value)
}

/**
 * Pulls the `src` out of a full `<iframe …>` snippet.
 *
 * Administrators copy whatever Google's dialog gives them, which is an iframe
 * tag. Rather than rejecting that outright and leaving them stuck, we extract
 * the src and then validate it like any other URL — the tag itself is never
 * stored or rendered.
 */
export function extractEmbedSrc(value: string): string | null {
  const match = /<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i.exec(value)
  if (!match) return null
  const candidate = match[1].trim()
  return isAllowedMapEmbedUrl(candidate) ? candidate : null
}

/**
 * Normalises administrator input into a storable embed URL, or null.
 *
 * Accepts a bare embed URL or a pasted iframe snippet. Returns null for
 * anything else, including non-Google hosts and arbitrary markup.
 */
export function normaliseMapEmbedInput(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null

  if (looksLikeHtml(trimmed)) return extractEmbedSrc(trimmed)
  return isAllowedMapEmbedUrl(trimmed) ? trimmed : null
}

export function isValidLatitude(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90
}

export function isValidLongitude(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180
}

/**
 * The URL to render, or null when there is nothing trustworthy to show.
 *
 * Order of preference:
 *  1. An administrator's own embed URL — they chose the exact framing.
 *  2. Confirmed coordinates, which we turn into a keyless embed.
 *  3. A place query, only as a last resort, because it is a guess by Google.
 *
 * The keyless `output=embed` form is used deliberately: the official Embed API
 * needs a billable key, and this module must work before anyone has configured
 * one. If a key is later added, this is the single place that changes.
 */
export function resolveMapEmbedUrl(source: MapSource): string | null {
  const stored = normaliseMapEmbedInput(source.mapEmbedUrl)
  if (stored) return stored

  if (isValidLatitude(source.latitude) && isValidLongitude(source.longitude)) {
    const query = `${source.latitude},${source.longitude}`
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`
  }

  const place = source.placeQuery?.trim()
  if (place && place.length > 2) {
    return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`
  }

  return null
}

/** A normal (non-embed) Google Maps link, for "open in Maps" buttons. */
export function resolveMapLinkUrl(source: MapSource): string | null {
  if (isValidLatitude(source.latitude) && isValidLongitude(source.longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${source.latitude},${source.longitude}`,
    )}`
  }

  const place = source.placeQuery?.trim()
  if (place && place.length > 2) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
  }

  return null
}

export function hasMap(source: MapSource): boolean {
  return resolveMapEmbedUrl(source) !== null
}
