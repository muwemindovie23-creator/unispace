'use client'

import { useActionState } from 'react'

import {
  CheckboxField,
  Notice,
  PROFILE_STATUS_OPTIONS,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from '@/components/admin/form-fields'
import { Card } from '@/components/ui/primitives'
import {
  createCampusAction,
  updateCampusAction,
  type ActionState,
} from '@/modules/universities/actions'

const INITIAL: ActionState = {}

export interface CampusFormValues {
  id: string
  name: string
  slug: string
  kind: string | null
  description: string | null
  city: string | null
  profileStatus: string
  isPrimary: boolean
  isPublished: boolean
  displayOrder: number
}

export function CampusForm({
  universityId,
  campus,
}: {
  universityId: string
  campus?: CampusFormValues
}) {
  const isEdit = Boolean(campus?.id)
  const [state, formAction] = useActionState(
    isEdit ? updateCampusAction : createCampusAction,
    INITIAL,
  )

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="universityId" value={universityId} />
      {campus?.id ? <input type="hidden" name="campusId" value={campus.id} /> : null}

      <Card className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Campus name"
            name="name"
            required
            defaultValue={campus?.name}
            placeholder="Chirunga Campus"
          />
          <TextField
            label="URL slug"
            name="slug"
            required
            defaultValue={campus?.slug}
            placeholder="chirunga"
            hint="Address: /universities/<university>/campus/<slug>"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Kind"
            name="kind"
            defaultValue={campus?.kind}
            placeholder="Constituent college"
            hint="Optional. Only fill this in where the institution actually uses such a label."
          />
          <TextField label="City" name="city" defaultValue={campus?.city} placeholder="Zomba" />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          rows={4}
          defaultValue={campus?.description}
          hint="What a student would want to know about this campus. Leave empty rather than guessing."
        />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Visibility</h2>

        <SelectField
          label="Profile status"
          name="profileStatus"
          defaultValue={campus?.profileStatus ?? 'COMING_SOON'}
          options={PROFILE_STATUS_OPTIONS}
        />

        <TextField
          label="Display order"
          name="displayOrder"
          type="number"
          defaultValue={String(campus?.displayOrder ?? 0)}
          hint="Lower numbers appear first. The main campus is always listed before the rest."
        />

        <CheckboxField
          label="Main campus"
          name="isPrimary"
          defaultChecked={campus?.isPrimary ?? false}
          hint="Only one campus per university can be the main one. Ticking this clears it from the others."
        />

        <CheckboxField
          label="Published"
          name="isPublished"
          defaultChecked={campus?.isPublished ?? false}
          hint="Unpublished campuses are hidden from visitors and from the campus selector."
        />
      </Card>

      <Notice state={state} />
      <SubmitButton>{isEdit ? 'Save campus' : 'Add campus'}</SubmitButton>
    </form>
  )
}
