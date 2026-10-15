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
  createUniversityAction,
  updateUniversityAction,
  type ActionState,
} from '@/modules/universities/actions'

const INITIAL: ActionState = {}

export interface UniversityFormValues {
  id?: string
  name: string
  acronym: string
  slug: string
  shortDescription: string | null
  longDescription: string | null
  city: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  profileStatus: string
  isPublished: boolean
  displayOrder: number
}

export function UniversityForm({
  university,
  canPublish,
}: {
  university?: UniversityFormValues
  canPublish: boolean
}) {
  const isEdit = Boolean(university?.id)
  const [state, formAction] = useActionState(
    isEdit ? updateUniversityAction : createUniversityAction,
    INITIAL,
  )

  return (
    <form action={formAction} className="space-y-5">
      {university?.id ? (
        <input type="hidden" name="universityId" value={university.id} />
      ) : null}

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Identity</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Full name"
            name="name"
            required
            defaultValue={university?.name}
            placeholder="University of Example"
          />
          <TextField
            label="Acronym"
            name="acronym"
            required
            defaultValue={university?.acronym}
            placeholder="UOE"
            hint="Shown on cards and badges. Keep the official capitalisation, e.g. KUHeS."
          />
        </div>

        <TextField
          label="URL slug"
          name="slug"
          required
          defaultValue={university?.slug}
          placeholder="university-of-example"
          hint={
            isEdit
              ? 'Changing this changes the public URL and breaks existing links. Only change it deliberately.'
              : 'Becomes the address: /universities/<slug>. Lowercase letters, numbers and hyphens.'
          }
        />

        <TextField
          label="City"
          name="city"
          defaultValue={university?.city}
          placeholder="Zomba"
        />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Description</h2>

        <TextAreaField
          label="Short description"
          name="shortDescription"
          rows={3}
          defaultValue={university?.shortDescription}
          hint="One or two sentences, shown on the university card. Write it for students, not for a prospectus."
        />

        <TextAreaField
          label="Longer introduction"
          name="longDescription"
          rows={6}
          defaultValue={university?.longDescription}
          hint="Optional. Shown on the university page. Leave empty rather than inventing detail."
        />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Images</h2>
        <p className="-mt-3 text-xs text-content-muted">
          Only use a logo or photograph you are authorised to publish. Add the image host to
          <code className="mx-1 rounded bg-surface-muted px-1.5 py-0.5">images.remotePatterns</code>
          in next.config.ts first.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Logo URL"
            name="logoUrl"
            type="url"
            defaultValue={university?.logoUrl}
            placeholder="https://…"
          />
          <TextField
            label="Cover image URL"
            name="coverImageUrl"
            type="url"
            defaultValue={university?.coverImageUrl}
            placeholder="https://…"
          />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Visibility</h2>

        <SelectField
          label="Profile status"
          name="profileStatus"
          defaultValue={university?.profileStatus ?? 'COMING_SOON'}
          options={PROFILE_STATUS_OPTIONS}
          hint="Be honest here. A badge saying the profile is still being built is better than an empty page with no explanation."
        />

        <TextField
          label="Display order"
          name="displayOrder"
          type="number"
          defaultValue={String(university?.displayOrder ?? 0)}
          hint="Lower numbers appear first on the homepage. Ties are ordered by name."
        />

        {canPublish ? (
          <CheckboxField
            label="Published"
            name="isPublished"
            defaultChecked={university?.isPublished ?? false}
            hint="Unpublished universities are hidden from the homepage, search and the sitemap."
          />
        ) : (
          <>
            {/* Without this the omitted checkbox would submit as "unpublish". */}
            {university?.isPublished ? (
              <input type="hidden" name="isPublished" value="on" />
            ) : null}
            <p className="rounded-xl border border-hairline bg-surface-muted px-3.5 py-2.5 text-xs text-content-muted">
              You can edit this university but not publish or unpublish it. It is currently{' '}
              <strong>{university?.isPublished ? 'published' : 'unpublished'}</strong>. Ask a Super
              Admin to change that.
            </p>
          </>
        )}
      </Card>

      <Notice state={state} />
      <SubmitButton>{isEdit ? 'Save university' : 'Create university'}</SubmitButton>
    </form>
  )
}
