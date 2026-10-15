'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { saveOfficialWebsiteAction, type ActionState } from '@/modules/admin/actions'

const INITIAL: ActionState = {}

export function OfficialWebsiteForm({
  universityId,
  officialWebsite,
  isConfirmed,
}: {
  universityId: string
  officialWebsite: string
  isConfirmed: boolean
}) {
  const [state, formAction] = useActionState(saveOfficialWebsiteAction, INITIAL)
  const checkboxId = `confirmed-${universityId}`
  const inputId = `website-${universityId}`

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="universityId" value={universityId} />

      <div>
        <label htmlFor={inputId} className="sr-only">
          Official website URL
        </label>
        <input
          id={inputId}
          name="officialWebsite"
          type="url"
          defaultValue={officialWebsite}
          placeholder="https://www.example.ac.mw"
          className="h-10 w-full max-w-md rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
        />
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id={checkboxId}
          name="confirmed"
          type="checkbox"
          defaultChecked={isConfirmed}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline accent-[var(--us-primary)]"
        />
        <label htmlFor={checkboxId} className="text-xs text-content-muted">
          I have opened this link and confirmed it is the university’s own official website.
        </label>
      </div>

      {state.error || state.success ? (
        <p
          role="status"
          className={`text-xs ${state.error ? 'text-red-700' : 'text-emerald-700'}`}
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
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? 'Saving…' : 'Save link'}
    </Button>
  )
}
