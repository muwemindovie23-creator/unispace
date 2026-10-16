'use client'

import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/primitives'
import {
  submitBusinessApplicationAction,
  type ActionState,
} from '@/modules/businesses/actions'

const INITIAL: ActionState = {}

const INPUT =
  'h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content ' +
  'transition-colors focus:border-brand focus:outline-none'

export interface UniversityOption {
  id: string
  name: string
  acronym: string
  campuses: { id: string; name: string }[]
}

export function BusinessApplicationForm({
  universities,
}: {
  universities: UniversityOption[]
}) {
  const [state, formAction] = useActionState(submitBusinessApplicationAction, INITIAL)
  const [universityId, setUniversityId] = useState('')

  const campuses = useMemo(
    () => universities.find((university) => university.id === universityId)?.campuses ?? [],
    [universities, universityId],
  )

  if (state.success) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <h2 className="text-base font-bold text-emerald-950">Application received</h2>
        <p role="status" className="mt-2 text-sm text-emerald-900">
          {state.success}
        </p>
      </Card>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Where you are</h2>

        <div>
          <label htmlFor="universityId" className="mb-1.5 block text-sm font-semibold text-content">
            University
          </label>
          <select
            id="universityId"
            name="universityId"
            required
            value={universityId}
            onChange={(event) => setUniversityId(event.target.value)}
            className={INPUT}
          >
            <option value="">Choose a university…</option>
            {universities.map((university) => (
              <option key={university.id} value={university.id}>
                {university.name} ({university.acronym})
              </option>
            ))}
          </select>
        </div>

        {campuses.length > 0 ? (
          <div>
            <label htmlFor="campusId" className="mb-1.5 block text-sm font-semibold text-content">
              Campus <span className="font-normal">(optional)</span>
            </label>
            <select id="campusId" name="campusId" className={INPUT}>
              <option value="">Not campus-specific</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label
            htmlFor="locationNote"
            className="mb-1.5 block text-sm font-semibold text-content"
          >
            Where exactly? <span className="font-normal">(optional)</span>
          </label>
          <input
            id="locationNote"
            name="locationNote"
            maxLength={300}
            placeholder="e.g. opposite the main gate, next to the pharmacy"
            aria-describedby="locationNote-hint"
            className={INPUT}
          />
          <p id="locationNote-hint" className="mt-1.5 text-xs text-content-muted">
            Describe it in words. A reviewer confirms the exact spot — please don’t send
            coordinates.
          </p>
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Your business</h2>

        <div>
          <label
            htmlFor="businessName"
            className="mb-1.5 block text-sm font-semibold text-content"
          >
            Business name
          </label>
          <input id="businessName" name="businessName" required maxLength={160} className={INPUT} />
        </div>

        <div>
          <label
            htmlFor="categoryHint"
            className="mb-1.5 block text-sm font-semibold text-content"
          >
            What kind of business? <span className="font-normal">(optional)</span>
          </label>
          <input
            id="categoryHint"
            name="categoryHint"
            maxLength={80}
            placeholder="e.g. printing and photocopying"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-content">
            What do you offer students?
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            minLength={20}
            maxLength={1500}
            className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="website" className="mb-1.5 block text-sm font-semibold text-content">
            Website or social page <span className="font-normal">(optional)</span>
          </label>
          <input
            id="website"
            name="website"
            type="url"
            placeholder="https://…"
            className={INPUT}
          />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">How we reach you</h2>
        <p className="-mt-3 text-xs text-content-muted">
          These details are for us to contact you about this application. They are not published,
          and they are not the contact details shown on your listing — you confirm those with the
          reviewer.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contactName"
              className="mb-1.5 block text-sm font-semibold text-content"
            >
              Your name
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

        <div>
          <label
            htmlFor="evidenceNote"
            className="mb-1.5 block text-sm font-semibold text-content"
          >
            How can we confirm this is your business?{' '}
            <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id="evidenceNote"
            name="evidenceNote"
            rows={3}
            maxLength={1000}
            aria-describedby="evidenceNote-hint"
            className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
          />
          <p id="evidenceNote-hint" className="mt-1.5 text-xs text-content-muted">
            A registration number, a public page, or simply the best time to find you there.
          </p>
        </div>
      </Card>

      <Card className="bg-surface-muted/70">
        <h2 className="text-sm font-bold text-content">Before you send this</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-content-muted">
          <li>Applying does not guarantee that you will be listed or verified.</li>
          <li>
            Verification confirms your identity and contact details — it is not an endorsement,
            a quality rating or a licence check.
          </li>
          <li>
            We store what you send here so we can review it and reply. See our{' '}
            <a href="/privacy" className="font-semibold text-brand underline underline-offset-2">
              Privacy Policy
            </a>
            .
          </li>
        </ul>

        <div className="mt-4 flex items-start gap-2.5">
          <input
            id="confirmAccurate"
            name="confirmAccurate"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline accent-[var(--us-primary)]"
          />
          <label htmlFor="confirmAccurate" className="text-sm text-content">
            These details are accurate, and I am authorised to publish them for this business.
          </label>
        </div>
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
      {pending ? 'Sending…' : 'Send application'}
    </Button>
  )
}
