'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useActionState, useState } from 'react'

import { Notice, SubmitButton } from '@/components/admin/form-fields'
import { Card } from '@/components/ui/primitives'
import {
  saveHomepageSectionsAction,
  type ActionState,
} from '@/modules/universities/actions'

const INITIAL: ActionState = {}

export interface SectionRow {
  key: string
  label: string
  description: string
  isEnabled: boolean
}

/**
 * Reordering uses explicit up/down buttons rather than drag-and-drop: it is
 * keyboard operable and screen-reader friendly without extra work, and the
 * list is short.
 */
export function HomepageSectionsForm({
  universityId,
  campusId,
  sections,
  lastSavedLabel,
}: {
  universityId: string
  campusId?: string
  sections: SectionRow[]
  lastSavedLabel: string
}) {
  const [rows, setRows] = useState(sections)
  const [state, formAction] = useActionState(saveHomepageSectionsAction, INITIAL)

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    setRows((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const toggle = (key: string) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, isEnabled: !row.isEnabled } : row)),
    )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="universityId" value={universityId} />
      <input type="hidden" name="campusId" value={campusId ?? ''} />

      <Card className="p-0">
        <ul className="divide-y divide-hairline">
          {rows.map((row, index) => (
            <li key={row.key} className="flex items-start gap-4 px-5 py-4">
              {/* Order is carried by the sequence of these hidden inputs. */}
              <input type="hidden" name="sectionKey" value={row.key} />
              {row.isEnabled ? (
                <input type="hidden" name="enabled" value={row.key} />
              ) : null}

              <input
                id={`toggle-${row.key}`}
                type="checkbox"
                checked={row.isEnabled}
                onChange={() => toggle(row.key)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-hairline accent-[var(--us-primary)]"
              />

              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`toggle-${row.key}`}
                  className="text-sm font-bold text-content"
                >
                  {row.label}
                </label>
                <p className="mt-0.5 text-xs text-content-muted">{row.description}</p>
              </div>

              <div className="flex shrink-0 gap-1">
                <OrderButton
                  label={`Move ${row.label} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp aria-hidden className="h-4 w-4" />
                </OrderButton>
                <OrderButton
                  label={`Move ${row.label} down`}
                  disabled={index === rows.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown aria-hidden className="h-4 w-4" />
                </OrderButton>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Notice state={state} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Save layout</SubmitButton>
        <p className="text-xs text-content-muted">{lastSavedLabel}</p>
      </div>
    </form>
  )
}

function OrderButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-hairline text-content-muted transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}
