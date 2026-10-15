'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import {
  acceptInviteAction,
  signInAction,
  type FormState,
} from '@/modules/admin/auth-actions'

const INITIAL: FormState = {}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-content">
      {children}
    </label>
  )
}

const INPUT_CLASS =
  'h-11 w-full rounded-xl border-2 border-hairline bg-surface px-3.5 text-sm text-content ' +
  'transition-colors focus:border-brand focus:outline-none'

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Working…' : children}
    </Button>
  )
}

function ErrorNotice({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900"
    >
      {message}
    </p>
  )
}

export function SignInForm() {
  const [state, formAction] = useActionState(signInAction, INITIAL)

  return (
    <form action={formAction} className="space-y-4">
      <ErrorNotice message={state.error} />

      <div>
        <FieldLabel htmlFor="email">Email address</FieldLabel>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={INPUT_CLASS}
        />
      </div>

      <SubmitButton>Sign in</SubmitButton>
    </form>
  )
}

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInviteAction, INITIAL)

  return (
    <form action={formAction} className="space-y-4">
      <ErrorNotice message={state.error} />
      <input type="hidden" name="token" value={token} />

      <div>
        <FieldLabel htmlFor="password">Choose a password</FieldLabel>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          aria-describedby="password-help"
          className={INPUT_CLASS}
        />
        <p id="password-help" className="mt-1.5 text-xs text-content-muted">
          At least 12 characters. A memorable phrase is stronger than a short, complex password.
        </p>
      </div>

      <div>
        <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className={INPUT_CLASS}
        />
      </div>

      <SubmitButton>Set password and sign in</SubmitButton>
    </form>
  )
}
