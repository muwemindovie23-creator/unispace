'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/primitives'
import { reportBusinessAction, type ActionState } from '@/modules/businesses/actions'
import { REPORT_REASON_LABELS } from '@/modules/businesses/schemas'

const INITIAL: ActionState = {}

export function ReportBusinessForm({
  businessId,
  businessName,
}: {
  businessId: string
  businessName: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(reportBusinessAction, INITIAL)

  if (state.success) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <p role="status" className="text-sm text-emerald-900">
          {state.success}
        </p>
      </Card>
    )
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Report a problem with this listing
      </Button>
    )
  }

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="businessId" value={businessId} />

        <div>
          <label htmlFor="reason" className="mb-1.5 block text-sm font-semibold text-content">
            What is wrong with {businessName}?
          </label>
          <select
            id="reason"
            name="reason"
            required
            className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
          >
            {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="details" className="mb-1.5 block text-sm font-semibold text-content">
            Anything else we should know? <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id="details"
            name="details"
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="reporterEmail"
            className="mb-1.5 block text-sm font-semibold text-content"
          >
            Your email <span className="font-normal">(optional)</span>
          </label>
          <input
            id="reporterEmail"
            name="reporterEmail"
            type="email"
            autoComplete="email"
            aria-describedby="reporterEmail-hint"
            className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
          />
          <p id="reporterEmail-hint" className="mt-1.5 text-xs text-content-muted">
            Only used if we need to ask you about this report. Leave it blank to report
            anonymously.
          </p>
        </div>

        {state.error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900"
          >
            {state.error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <SubmitButton />
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Sending…' : 'Send report'}
    </Button>
  )
}
