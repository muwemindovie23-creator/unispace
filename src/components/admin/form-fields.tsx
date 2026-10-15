'use client'

import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import type { ActionState } from '@/modules/universities/actions'

/** Shared field primitives for the dashboard forms. */

export const INPUT_CLASS =
  'h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content ' +
  'transition-colors focus:border-brand focus:outline-none'

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-content">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-content-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function TextField({
  label,
  name,
  defaultValue,
  hint,
  required,
  placeholder,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string | null
  hint?: string
  required?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ''}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className={INPUT_CLASS}
      />
    </Field>
  )
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  hint,
  rows = 4,
}: {
  label: string
  name: string
  defaultValue?: string | null
  hint?: string
  rows?: number
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
      />
    </Field>
  )
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
  hint?: string
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className={INPUT_CLASS}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string
  name: string
  defaultChecked?: boolean
  hint?: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline accent-[var(--us-primary)]"
      />
      <div>
        <label htmlFor={name} className="text-sm font-semibold text-content">
          {label}
        </label>
        {hint ? (
          <p id={`${name}-hint`} className="text-xs text-content-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function Notice({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null
  return (
    <p
      role="status"
      className={`rounded-xl px-3.5 py-2.5 text-sm ${
        state.error
          ? 'border border-red-200 bg-red-50 text-red-900'
          : 'border border-emerald-200 bg-emerald-50 text-emerald-900'
      }`}
    >
      {state.error ?? state.success}
    </p>
  )
}

export function SubmitButton({
  children,
  pendingLabel = 'Saving…',
  variant = 'primary',
  size = 'md',
}: {
  children: React.ReactNode
  pendingLabel?: string
  variant?: 'primary' | 'outline' | 'accent' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  )
}

export const PROFILE_STATUS_OPTIONS = [
  { value: 'COMING_SOON', label: 'Coming soon — shown to visitors as not ready yet' },
  { value: 'IN_PROGRESS', label: 'Profile being built — partially filled in' },
  { value: 'COMPLETE', label: 'Complete — no status badge shown' },
]
