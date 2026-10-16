import { ExternalLink, MapPin } from 'lucide-react'

import { Card } from '@/components/ui/primitives'
import { resolveMapEmbedUrl, resolveMapLinkUrl, type MapSource } from '@/lib/maps'
import { cn } from '@/lib/utils'

/**
 * The only place in UniSpace that renders an iframe.
 *
 * The src always comes from `resolveMapEmbedUrl`, which refuses anything that
 * is not a Google Maps embed, so administrator- or applicant-supplied values
 * cannot frame an arbitrary site. The frame is sandboxed and lazily loaded, so
 * a slow map never blocks the rest of the page.
 */
export function MapEmbed({
  source,
  title,
  className,
  heightClass = 'h-64',
}: {
  source: MapSource
  /** Describes the place, for screen readers. */
  title: string
  className?: string
  heightClass?: string
}) {
  const embedUrl = resolveMapEmbedUrl(source)
  const linkUrl = resolveMapLinkUrl(source)

  if (!embedUrl) {
    return (
      <Card className={cn('border-dashed bg-surface-muted/60 text-center', className)}>
        <MapPin aria-hidden className="mx-auto mb-2 h-5 w-5 text-content-muted" />
        <p className="text-sm text-content-muted">
          No confirmed location for this place yet. UniSpace does not guess coordinates.
        </p>
      </Card>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-theme border border-hairline', className)}>
      <iframe
        src={embedUrl}
        title={`Map showing ${title}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-popups"
        allowFullScreen
        className={cn('w-full border-0', heightClass)}
      />
      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 border-t border-hairline bg-surface px-4 py-2.5 text-xs font-semibold text-brand hover:underline"
        >
          Open in Google Maps
          <ExternalLink aria-hidden className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  )
}
