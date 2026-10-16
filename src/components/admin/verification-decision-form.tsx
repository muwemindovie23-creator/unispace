'use client'

import { useActionState, useState } from 'react'

import { Notice, SubmitButton } from '@/components/admin/form-fields'
import { Button } from '@/components/ui/button'
import { decideBusinessApplicationAction } from '@/modules/businesses/actions'
import type { ActionState } from '@/modules/universities/actions'

const INITIAL: ActionState = {}

/**
 * Recording a verification decision.
 *
 * `checksPerformed` is required by the schema, not merely encouraged: the
 * public page shows that sentence next to the badge, so a decision with no
 * record of what was checked would make the badge meaningless.
 */
export function VerificationDecisionForm({
  applicationId,
  canPublish,
}: {
  applicationId: string
  canPublish: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [decision, setDecision] = useState('VERIFIED')
  const [state, formAction] = useActionState(decideBusinessApplicationAction, INITIAL)

  if (state.success) {
    return (
      <p
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900"
      >
        {state.success}
      </p>
    )
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Record a decision
      </Button>
    )
  }

  return (
    <form action={formAction} className="mt-4 space-y-4 border-t border-hairline pt-4">
      <input type="hidden" name="applicationId" value={applicationId} />

      <div>
        <label
          htmlFor={`decision-${applicationId}`}
          className="mb-1.5 block text-sm font-semibold text-content"
        >
          Decision
        </label>
        <select
          id={`decision-${applicationId}`}
          name="decision"
          required
          value={decision}
          onChange={(event) => setDecision(event.target.value)}
          className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
        >
          <option value="VERIFIED">Verified — identity and contact details confirmed</option>
          <option value="NEEDS_REVIEW">Needs review — something does not add up yet</option>
          <option value="REJECTED">Rejected — cannot be listed</option>
        </select>
      </div>

      {/* Verifying creates a listing but does not make it public. Saying so
          here, at the moment of the decision, is the whole point. */}
      {decision === 'VERIFIED' ? (
        <div className="rounded-xl border border-hairline bg-surface-muted/70 p-3.5">
          {canPublish ? (
            <>
              <div className="flex items-start gap-2.5">
                <input
                  id={`publish-${applicationId}`}
                  name="publishNow"
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline accent-[var(--us-primary)]"
                />
                <label
                  htmlFor={`publish-${applicationId}`}
                  className="text-sm font-semibold text-content"
                >
                  Publish the listing straight away
                </label>
              </div>
              <p className="mt-1.5 pl-7 text-xs text-content-muted">
                The listing starts from the applicant’s own words. Untick this if you want to edit
                the copy before students see it — it will be saved as a draft instead, and{' '}
                <strong>will not appear in the directory until you publish it</strong>.
              </p>
            </>
          ) : (
            <p className="text-xs text-content-muted">
              A listing will be created as a <strong>draft</strong>. You do not have permission to
              publish listings here, so it will not appear in the directory until someone who does
              reviews and publishes it.
            </p>
          )}
        </div>
      ) : null}

      <div>
        <label
          htmlFor={`checks-${applicationId}`}
          className="mb-1.5 block text-sm font-semibold text-content"
        >
          What did you actually check?
        </label>
        <textarea
          id={`checks-${applicationId}`}
          name="checksPerformed"
          required
          rows={3}
          minLength={5}
          maxLength={600}
          placeholder="e.g. Called the number listed and spoke to the owner; visited the shop on 16 Oct and confirmed the location."
          aria-describedby={`checks-hint-${applicationId}`}
          className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
        />
        <p id={`checks-hint-${applicationId}`} className="mt-1.5 text-xs text-content-muted">
          This is shown publicly next to the badge. Write only what you did, not what you assume.
        </p>
      </div>

      <div>
        <label
          htmlFor={`note-${applicationId}`}
          className="mb-1.5 block text-sm font-semibold text-content"
        >
          Internal note <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id={`note-${applicationId}`}
          name="note"
          rows={2}
          maxLength={1000}
          className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
        />
      </div>

      <Notice state={state} />

      <div className="flex gap-3">
        <SubmitButton pendingLabel="Recording…">Record decision</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
