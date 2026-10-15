import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>
}

/**
 * Polymorphic: `as={Link}` or `as="li"` keeps that element's own props typed,
 * so a Card can be a link without losing `href` checking.
 */
type CardProps<T extends ElementType> = {
  as?: T
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

export function Card<T extends ElementType = 'div'>({
  className,
  children,
  as,
  ...props
}: CardProps<T>) {
  const Tag = (as ?? 'div') as ElementType
  return (
    <Tag
      className={cn(
        'rounded-theme border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(16,12,40,0.04)]',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

type BadgeTone = 'neutral' | 'brand' | 'accent' | 'positive' | 'caution' | 'muted'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-content',
  brand: 'bg-highlight text-content',
  accent: 'bg-accent text-accent-contrast',
  positive: 'bg-emerald-100 text-emerald-900',
  caution: 'bg-amber-100 text-amber-950',
  muted: 'border border-hairline bg-surface text-content-muted',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-tight',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-extrabold tracking-tight text-content sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 text-content-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

/**
 * Purposeful empty state. UniSpace shows these rather than inventing content,
 * so a campus that has not filled a section in yet still reads as honest.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="flex flex-col items-center gap-3 border-dashed bg-surface-muted/60 py-10 text-center">
      {icon ? <div className="text-brand">{icon}</div> : null}
      <h3 className="text-lg font-bold text-content">{title}</h3>
      <p className="max-w-md text-sm text-content-muted">{description}</p>
      {action}
    </Card>
  )
}
