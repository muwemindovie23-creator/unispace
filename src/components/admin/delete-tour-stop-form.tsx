'use client'

import { useActionState, useState } from 'react'

import { Notice, SubmitButton } from '@/components/admin/form-fields'
import { deleteTourStopAction } from '@/modules/tour/actions'
import type { ActionState } from '@/modules/universities/actions'

const INITIAL: ActionState = {}

export function DeleteTourStopForm({
  stopId,
  stopTitle,
}: {
  stopId: string
  stopTitle: string
}) {
  const [confirmation, setConfirmation] = useState('')
  const [state, formAction] = useActionState(deleteTourStopAction, INITIAL)
  const matches = confirmation.trim() === stopTitle

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="stopId" value={stopId} />

      <label htmlFor="confirm-delete-stop" className="block text-xs font-semibold text-red-950">
        Type <strong>{stopTitle}</strong> to confirm
      </label>
      <input
        id="confirm-delete-stop"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="off"
        className="h-10 w-full max-w-sm rounded-lg border-2 border-red-200 bg-surface px-3 text-sm text-content focus:border-red-500 focus:outline-none"
      />

      <Notice state={state} />

      <div className={matches ? '' : 'pointer-events-none opacity-50'}>
        <SubmitButton variant="outline" size="sm" pendingLabel="Deleting…">
          Delete stop
        </SubmitButton>
      </div>
    </form>
  )
}
