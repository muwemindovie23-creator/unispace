'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/primitives'
import { saveSettingsAction, type ActionState } from '@/modules/admin/actions'

const INITIAL: ActionState = {}

export function SettingsForm({
  settings,
}: {
  settings: { key: string; value: string; description: string }[]
}) {
  const [state, formAction] = useActionState(saveSettingsAction, INITIAL)

  return (
    <form action={formAction} className="space-y-5">
      <Card className="space-y-5">
        {settings.map((setting) => (
          <div key={setting.key}>
            <label htmlFor={setting.key} className="mb-1.5 block text-sm font-semibold text-content">
              {setting.key}
            </label>
            <input
              id={setting.key}
              name={setting.key}
              defaultValue={setting.value}
              aria-describedby={`${setting.key}-help`}
              placeholder={
                setting.key.includes('email') ? 'name@example.org' : 'Not configured yet'
              }
              className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
            />
            <p id={`${setting.key}-help`} className="mt-1.5 text-xs text-content-muted">
              {setting.description}
            </p>
          </div>
        ))}
      </Card>

      {state.error || state.success ? (
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
      ) : null}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save settings'}
    </Button>
  )
}
