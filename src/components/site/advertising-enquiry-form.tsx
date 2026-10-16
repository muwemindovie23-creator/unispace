'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/primitives'
import {
  submitAdvertisingEnquiryAction,
  type ActionState,
} from '@/modules/advertising/actions'

const INITIAL: ActionState = {}

const INPUT =
  'h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content ' +
  'transition-colors focus:border-brand focus:outline-none'

export function AdvertisingEnquiryForm({
  universities,
  placements,
}: {
  universities: { id: string; name: string; acronym: string }[]
  placements: { id: string; name: string }[]
}) {
  const [state, formAction] = useActionState(submitAdvertisingEnquiryAction, INITIAL)

  if (state.success) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <h2 className="text-base font-bold text-emerald-950">Enquiry sent</h2>
        <p role="status" className="mt-2 text-sm text-emerald-900">
          {state.success}
        </p>
      </Card>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">About you</h2>

        <div>
          <label
            htmlFor="organisation"
            className="mb-1.5 block text-sm font-semibold text-content"
          >
            Organisation or business name
          </label>
          <input id="organisation" name="organisation" required maxLength={160} className={INPUT} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contactName"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Contact name
            </label>
            <input
              id="contactName"
              name="contactName"
              required
              autoComplete="name"
              maxLength={120}
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="contactEmail"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              autoComplete="email"
              maxLength={160}
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contactPhone"
            className="mb-1.5 block text-sm font-semibold text-content"
          >
            Phone <span className="font-normal">(optional)</span>
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={INPUT}
          />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Your campaign</h2>

        <div>
          <label htmlFor="objective" className="mb-1.5 block text-sm font-semibold text-content">
            What are you trying to achieve?
          </label>
          <textarea
            id="objective"
            name="objective"
            required
            rows={4}
            minLength={10}
            maxLength={1500}
            className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="universityId"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Target university <span className="font-normal">(optional)</span>
            </label>
            <select id="universityId" name="universityId" className={INPUT}>
              <option value="">No preference</option>
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.acronym} — {university.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="campusHint"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Campus <span className="font-normal">(optional)</span>
            </label>
            <input id="campusHint" name="campusHint" maxLength={160} className={INPUT} />
          </div>
        </div>

        {placements.length > 0 ? (
          <div>
            <label
              htmlFor="placementId"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Placement you are interested in <span className="font-normal">(optional)</span>
            </label>
            <select id="placementId" name="placementId" className={INPUT}>
              <option value="">Not sure yet</option>
              {placements.map((placement) => (
                <option key={placement.id} value={placement.id}>
                  {placement.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="preferredStart"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Preferred start <span className="font-normal">(optional)</span>
            </label>
            <input id="preferredStart" name="preferredStart" type="date" className={INPUT} />
          </div>
          <div>
            <label
              htmlFor="preferredEnd"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Preferred end <span className="font-normal">(optional)</span>
            </label>
            <input id="preferredEnd" name="preferredEnd" type="date" className={INPUT} />
          </div>
        </div>

        <div>
          <label htmlFor="budgetRange" className="mb-1.5 block text-sm font-semibold text-content">
            Budget range <span className="font-normal">(optional)</span>
          </label>
          <input id="budgetRange" name="budgetRange" maxLength={80} className={INPUT} />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-content">
            Anything else <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={1500}
            className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
          />
        </div>
      </Card>

      <Card className="bg-surface-muted/70">
        <p className="text-sm text-content-muted">
          We store what you send here so we can reply and manage your enquiry. We do not pass it on
          to anyone else, and advertising with us never gives you access to any visitor’s
          information. See our{' '}
          <a href="/privacy" className="font-semibold text-brand underline underline-offset-2">
            Privacy Policy
          </a>
          . Sending this is an enquiry, not a booking.
        </p>
      </Card>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Sending…' : 'Send enquiry'}
    </Button>
  )
}
