'use client'

import { useActionState, useState } from 'react'

import { Notice, SubmitButton } from '@/components/admin/form-fields'
import { deleteCampusAction, type ActionState } from '@/modules/universities/actions'

const INITIAL: ActionState = {}

/**
 * Deletion asks the administrator to type the campus name first. It is a
 * destructive action on content other people may depend on, and the server
 * refuses anyway while anything still references the campus.
 */
export function DeleteCampusForm({
  campusId,
  campusName,
}: {
  campusId: string
  campusName: string
}) {
  const [confirmation, setConfirmation] = useState('')
  const [state, formAction] = useActionState(deleteCampusAction, INITIAL)
  const matches = confirmation.trim() === campusName

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="campusId" value={campusId} />

      <label htmlFor="confirm-delete" className="block text-xs font-semibold text-red-950">
        Type <strong>{campusName}</strong> to confirm
      </label>
      <input
        id="confirm-delete"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="off"
        className="h-10 w-full max-w-sm rounded-lg border-2 border-red-200 bg-surface px-3 text-sm text-content focus:border-red-500 focus:outline-none"
      />

      <Notice state={state} />

      <div className={matches ? '' : 'pointer-events-none opacity-50'}>
        <SubmitButton variant="outline" size="sm" pendingLabel="Deleting…">
          Delete campus
        </SubmitButton>
      </div>
    </form>
  )
}
