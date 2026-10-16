'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Badge, Card } from '@/components/ui/primitives'
import { auditThemeContrast, themeToCssVariables, type ThemeTokens } from '@/lib/theme/tokens'
import {
  publishThemeAction,
  saveDraftThemeAction,
  type ActionState,
} from '@/modules/admin/actions'

const COLOUR_FIELDS: { name: keyof ThemeTokens; label: string; hint?: string }[] = [
  { name: 'primaryColor', label: 'Primary', hint: 'Buttons, links and highlights.' },
  { name: 'primaryContrast', label: 'Primary label', hint: 'Text drawn on the primary colour.' },
  { name: 'secondaryColor', label: 'Secondary' },
  { name: 'secondaryContrast', label: 'Secondary label' },
  { name: 'accentColor', label: 'Accent' },
  { name: 'accentContrast', label: 'Accent label' },
  { name: 'backgroundColor', label: 'Page background' },
  { name: 'surfaceColor', label: 'Card background' },
  { name: 'surfaceMutedColor', label: 'Muted surface' },
  { name: 'textPrimaryColor', label: 'Body text' },
  { name: 'textSecondaryColor', label: 'Muted text' },
  { name: 'borderColor', label: 'Borders' },
  { name: 'highlightColor', label: 'Highlight panels' },
]

const INITIAL: ActionState = {}

export function ThemeEditor({
  universityId,
  universityName,
  acronym,
  draft,
  sourceNote,
  hasPublished,
  hasUnpublishedChanges,
}: {
  universityId: string
  universityName: string
  acronym: string
  draft: ThemeTokens
  sourceNote: string | null
  hasPublished: boolean
  hasUnpublishedChanges: boolean
}) {
  const [tokens, setTokens] = useState<ThemeTokens>(draft)
  const [saveState, saveAction] = useActionState(saveDraftThemeAction, INITIAL)
  const [publishState, publishAction] = useActionState(publishThemeAction, INITIAL)

  const findings = auditThemeContrast(tokens)
  const failures = findings.filter((finding) => !finding.passes)

  const update = (name: keyof ThemeTokens, value: string) =>
    setTokens((current) => ({ ...current, [name]: value }))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* ------------------------------------------------------------ Editor */}
      <div className="space-y-6">
        <form action={saveAction} className="space-y-6">
          <input type="hidden" name="universityId" value={universityId} />

          <Card>
            <h2 className="text-base font-bold text-content">Colours</h2>
            <p className="mt-1 mb-5 text-sm text-content-muted">
              Changes here affect every page under {acronym}. No component holds a university’s
              colours — they all read these values.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {COLOUR_FIELDS.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="mb-1.5 block text-sm font-semibold text-content"
                  >
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label={`${field.label} colour picker`}
                      value={normaliseHex(String(tokens[field.name]))}
                      onChange={(event) => update(field.name, event.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-hairline bg-surface p-1"
                    />
                    <input
                      id={field.name}
                      name={field.name}
                      value={String(tokens[field.name])}
                      onChange={(event) => update(field.name, event.target.value)}
                      spellCheck={false}
                      className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 font-mono text-sm text-content focus:border-brand focus:outline-none"
                    />
                  </div>
                  {field.hint ? (
                    <p className="mt-1 text-xs text-content-muted">{field.hint}</p>
                  ) : null}
                </div>
              ))}

              <div>
                <label htmlFor="radius" className="mb-1.5 block text-sm font-semibold text-content">
                  Corner radius
                </label>
                <input
                  id="radius"
                  name="radius"
                  value={tokens.radius}
                  onChange={(event) => update('radius', event.target.value)}
                  className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 font-mono text-sm text-content focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-xs text-content-muted">For example 0.75rem or 1.25rem.</p>
              </div>
            </div>
          </Card>

          <Card>
            <label htmlFor="sourceNote" className="mb-1.5 block text-sm font-semibold text-content">
              Where these colours came from
            </label>
            <textarea
              id="sourceNote"
              name="sourceNote"
              rows={3}
              defaultValue={sourceNote ?? ''}
              placeholder="e.g. Taken from the 2024 brand guideline supplied by the Marketing Office."
              className="w-full rounded-xl border-2 border-hairline bg-surface p-3 text-sm text-content focus:border-brand focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-content-muted">
              Record the source so the next administrator knows whether these are confirmed brand
              colours or a placeholder.
            </p>
          </Card>

          <Notice state={saveState} />
          <SaveButton />
        </form>

        {/* Publishing is a separate decision from saving a draft. */}
        <Card className="bg-surface-muted/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-content">Publish</h2>
            {/* Read from the database on every load, so it survives the router
                refresh that publishing triggers. */}
            <Badge tone={hasUnpublishedChanges ? 'caution' : 'positive'}>
              {hasUnpublishedChanges
                ? 'Draft differs from what visitors see'
                : 'Published — visitors see this theme'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-content-muted">
            Save your draft first, then publish it. Publishing is blocked while any colour pairing
            fails the contrast check below, so a theme cannot make pages unreadable.
          </p>

          <Notice state={publishState} />

          <form action={publishAction} className="mt-4">
            <input type="hidden" name="universityId" value={universityId} />
            <PublishButton disabled={failures.length > 0} />
          </form>

          {!hasPublished ? (
            <p className="mt-3 text-xs text-content-muted">
              {universityName} has no published theme yet and is using the UniSpace default.
            </p>
          ) : null}
        </Card>
      </div>

      {/* ----------------------------------------------------------- Preview */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-0">
          <p className="border-b border-hairline px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-content-muted">
            Live preview
          </p>
          <div
            style={themeToCssVariables(tokens) as React.CSSProperties}
            className="rounded-b-theme bg-canvas p-5 text-content"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{acronym}</p>
            <h3 className="mt-1.5 text-xl font-black tracking-tight text-content">
              What’s on this week
            </h3>
            <p className="mt-1.5 text-sm text-content-muted">
              Open airs, campus events and sports fixtures across campus.
            </p>

            <div className="mt-4 rounded-theme border border-hairline bg-surface p-4">
              <span className="inline-flex items-center rounded-full bg-highlight px-2.5 py-1 text-xs font-semibold text-content">
                Student tip
              </span>
              <p className="mt-2 text-sm text-content">
                Card text sits on the surface colour.
              </p>
              <p className="mt-1 text-sm text-content-muted">
                Muted text is used for supporting detail.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-theme bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast">
                Primary
              </span>
              <span className="rounded-theme bg-ink px-4 py-2 text-sm font-semibold text-ink-contrast">
                Secondary
              </span>
              <span className="rounded-theme bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast">
                Accent
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-content">Contrast check</h3>
          <p className="mt-1 mb-3 text-xs text-content-muted">
            WCAG AA requires 4.5:1 for body text.
          </p>
          <ul className="space-y-2">
            {findings.map((finding) => (
              <li key={finding.pair} className="flex items-start justify-between gap-3">
                <span className="text-xs text-content-muted">{finding.pair}</span>
                <Badge tone={finding.passes ? 'positive' : 'caution'}>
                  {finding.ratio === null ? 'invalid' : `${finding.ratio}:1`}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function normaliseHex(value: string): string {
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value.trim())
  if (!match) return '#000000'
  if (match[1].length === 3) {
    return `#${match[1]
      .split('')
      .map((char) => char + char)
      .join('')}`
  }
  return value.trim()
}

function Notice({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null
  return (
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
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save draft'}
    </Button>
  )
}

function PublishButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="accent" disabled={disabled || pending}>
      {pending ? 'Publishing…' : 'Publish theme'}
    </Button>
  )
}
