import type { CSSProperties, ReactNode } from 'react'

import { themeToCssVariables, type ThemeTokens } from '@/lib/theme/tokens'
import { cn } from '@/lib/utils'

/**
 * Applies a university's theme to everything inside it.
 *
 * The variables are rendered server-side as inline styles, so the correct
 * campus colours are present in the first byte of HTML — no flash of the wrong
 * theme, and no client-side theme script.
 */
export function ThemeScope({
  theme,
  className,
  children,
}: {
  theme: Partial<ThemeTokens> | null | undefined
  className?: string
  children: ReactNode
}) {
  const style = themeToCssVariables(theme) as CSSProperties

  return (
    <div style={style} className={cn('bg-canvas text-content', className)}>
      {children}
    </div>
  )
}
