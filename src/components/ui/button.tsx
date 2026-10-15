import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-contrast hover:brightness-110 shadow-sm',
  secondary: 'bg-ink text-ink-contrast hover:brightness-125',
  accent: 'bg-accent text-accent-contrast hover:brightness-105 shadow-sm',
  outline: 'border-2 border-hairline bg-surface text-content hover:border-brand hover:bg-highlight',
  ghost: 'text-content hover:bg-surface-muted',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

const BASE =
  'inline-flex items-center justify-center rounded-theme font-semibold ' +
  'transition-[transform,filter,background-color,border-color] duration-200 ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 ' +
  'motion-reduce:transition-none motion-reduce:active:scale-100'

interface SharedProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: SharedProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  href,
  ...props
}: SharedProps & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </Link>
  )
}

/** External links always open in a new tab with the usual rel protections. */
export function ExternalButtonLink({
  variant = 'outline',
  size = 'md',
  className,
  children,
  href,
  ...props
}: SharedProps & ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </a>
  )
}
