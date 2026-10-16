'use client'

import { useActionState, useState } from 'react'

import { Notice, SubmitButton } from '@/components/admin/form-fields'
import { Button } from '@/components/ui/button'
import {
  setPlacementAvailabilityAction,
  updateEnquiryStatusAction,
  type ActionState,
} from '@/modules/advertising/actions'

const INITIAL: ActionState = {}

const STATUSES = ['NEW', 'IN_REVIEW', 'CONTACTED', 'APPROVED', 'DECLINED', 'CLOSED'] as const

export function EnquiryStatusForm({
  enquiryId,
  currentStatus,
  internalNote,
}: {
  enquiryId: string
  currentStatus: string
  internalNote: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(updateEnquiryStatusAction, INITIAL)

  if (!isOpen) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          Update
        </Button>
        {state.success ? (
          <span role="status" className="text-xs text-emerald-700">
            {state.success}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-hairline pt-3">
      <input type="hidden" name="enquiryId" value={enquiryId} />

      <div>
        <label
          htmlFor={`status-${enquiryId}`}
          className="mb-1.5 block text-xs font-semibold text-content"
        >
          Status
        </label>
        <select
          id={`status-${enquiryId}`}
          name="status"
          defaultValue={currentStatus}
          className="h-9 w-full max-w-xs rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.toLowerCase().replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`note-${enquiryId}`}
          className="mb-1.5 block text-xs font-semibold text-content"
        >
          Internal note
        </label>
        <textarea
          id={`note-${enquiryId}`}
          name="internalNote"
          rows={2}
          maxLength={1500}
          defaultValue={internalNote ?? ''}
          className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
        />
      </div>

      <Notice state={state} />

      <div className="flex gap-3">
        <SubmitButton size="sm">Save</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/**
 * Placement availability. Nothing is offered on the public Advertise page
 * until someone deliberately switches it on here.
 */
export function PlacementToggleForm({
  placementId,
  isAvailable,
}: {
  placementId: string
  isAvailable: boolean
}) {
  const [state, formAction] = useActionState(setPlacementAvailabilityAction, INITIAL)

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="placementId" value={placementId} />
      {/* Submitting the opposite of the current value makes this a toggle. */}
      {!isAvailable ? <input type="hidden" name="isAvailable" value="on" /> : null}
      <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
        {isAvailable ? 'Make unavailable' : 'Make available'}
      </SubmitButton>
      {state.error ? (
        <span role="alert" className="text-xs text-red-700">
          {state.error}
        </span>
      ) : null}
    </form>
  )
}
