'use client'

import { useActionState, useState } from 'react'

import {
  CheckboxField,
  Notice,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from '@/components/admin/form-fields'
import { MapEmbed } from '@/components/site/map-embed'
import { Card } from '@/components/ui/primitives'
import { saveBusinessAction } from '@/modules/businesses/actions'
import type { ActionState } from '@/modules/universities/actions'

const INITIAL: ActionState = {}

export interface BusinessFormValues {
  id?: string
  name: string
  slug: string
  description: string
  categoryId: string | null
  campusId: string | null
  locationNote: string | null
  latitude: number | null
  longitude: number | null
  mapEmbedUrl: string | null
  showOnMap: boolean
  publicPhone: string | null
  publicEmail: string | null
  priceRange: string | null
  services: string | null
  status: string
  isSponsored: boolean
}

export function BusinessForm({
  universityId,
  business,
  campuses,
  categories,
  canPublish,
  canSponsor,
}: {
  universityId: string
  business?: BusinessFormValues
  campuses: { id: string; name: string }[]
  categories: { id: string; label: string }[]
  canPublish: boolean
  canSponsor: boolean
}) {
  const [state, formAction] = useActionState(saveBusinessAction, INITIAL)

  // Mirrored into state so the administrator sees the map they are configuring
  // before they save it.
  const [mapEmbedUrl, setMapEmbedUrl] = useState(business?.mapEmbedUrl ?? '')
  const [latitude, setLatitude] = useState(business?.latitude?.toString() ?? '')
  const [longitude, setLongitude] = useState(business?.longitude?.toString() ?? '')

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft — not visible to anyone' },
    { value: 'NEEDS_REVIEW', label: 'Needs review — waiting for a second pair of eyes' },
    ...(canPublish ? [{ value: 'PUBLISHED', label: 'Published — visible to everyone' }] : []),
    { value: 'ARCHIVED', label: 'Archived — hidden, kept for the record' },
  ]

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="universityId" value={universityId} />
      {business?.id ? <input type="hidden" name="businessId" value={business.id} /> : null}

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">The business</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Name" name="name" required defaultValue={business?.name} />
          <TextField
            label="URL slug"
            name="slug"
            required
            defaultValue={business?.slug}
            hint="Appears in the listing's address."
          />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          rows={4}
          defaultValue={business?.description}
          hint="What they offer students. Describe only what you can stand behind."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Category"
            name="categoryId"
            defaultValue={business?.categoryId ?? ''}
            options={[
              { value: '', label: 'No category' },
              ...categories.map((category) => ({ value: category.id, label: category.label })),
            ]}
          />
          <SelectField
            label="Campus"
            name="campusId"
            defaultValue={business?.campusId ?? ''}
            options={[
              { value: '', label: 'University-wide' },
              ...campuses.map((campus) => ({ value: campus.id, label: campus.name })),
            ]}
          />
        </div>

        <TextAreaField
          label="Services"
          name="services"
          rows={3}
          defaultValue={business?.services}
          hint="Optional. What they actually do, in their words where possible."
        />

        <TextField
          label="Price range"
          name="priceRange"
          defaultValue={business?.priceRange}
          hint="Optional, and date it in the description if you quote figures — prices go stale fast."
        />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Contact details to publish</h2>
        <p className="-mt-3 text-xs text-content-muted">
          Only publish details the business has agreed to make public. Never a personal number
          given to you in confidence.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Public phone" name="publicPhone" defaultValue={business?.publicPhone} />
          <TextField
            label="Public email"
            name="publicEmail"
            type="email"
            defaultValue={business?.publicEmail}
          />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Where it is</h2>

        <TextField
          label="Location in words"
          name="locationNote"
          defaultValue={business?.locationNote}
          hint="e.g. opposite the main gate, next to the pharmacy."
        />

        <div>
          <label htmlFor="mapEmbedUrl" className="mb-1.5 block text-sm font-semibold text-content">
            Google Maps embed
          </label>
          <textarea
            id="mapEmbedUrl"
            name="mapEmbedUrl"
            rows={3}
            value={mapEmbedUrl}
            onChange={(event) => setMapEmbedUrl(event.target.value)}
            placeholder="Paste from Google Maps → Share → Embed a map"
            aria-describedby="mapEmbedUrl-hint"
            className="w-full rounded-xl border-2 border-hairline bg-surface p-3 font-mono text-xs text-content focus:border-brand focus:outline-none"
          />
          <p id="mapEmbedUrl-hint" className="mt-1.5 text-xs text-content-muted">
            Paste either the URL or the whole <code>&lt;iframe&gt;</code> tag — we take the
            address out of it. Only Google Maps embeds are accepted; anything else is rejected
            when you save.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="latitude" className="mb-1.5 block text-sm font-semibold text-content">
              Latitude
            </label>
            <input
              id="latitude"
              name="latitude"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              placeholder="-15.3869"
              className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="mb-1.5 block text-sm font-semibold text-content">
              Longitude
            </label>
            <input
              id="longitude"
              name="longitude"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              placeholder="35.3188"
              className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-content-muted">
          Only enter coordinates you have actually confirmed. Leave them empty rather than
          guessing — an empty map is better than a wrong pin.
        </p>

        <CheckboxField
          label="Show on campus maps and the virtual tour"
          name="showOnMap"
          defaultChecked={business?.showOnMap ?? true}
        />

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-content-muted">
            Map preview
          </p>
          <MapEmbed
            source={{
              mapEmbedUrl,
              latitude: latitude.trim() === '' ? null : Number(latitude),
              longitude: longitude.trim() === '' ? null : Number(longitude),
            }}
            title="this listing"
            heightClass="h-56"
          />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Visibility</h2>

        <SelectField
          label="Status"
          name="status"
          defaultValue={business?.status ?? 'DRAFT'}
          options={statusOptions}
        />

        {canSponsor ? (
          <CheckboxField
            label="Sponsored placement"
            name="isSponsored"
            defaultChecked={business?.isSponsored ?? false}
            hint="Sorts this listing first and shows a “Sponsored” badge. It must reflect a real paid arrangement, and it never changes the verification status."
          />
        ) : (
          <>
            {business?.isSponsored ? (
              <input type="hidden" name="isSponsored" value="on" />
            ) : null}
            <p className="rounded-xl border border-hairline bg-surface-muted px-3.5 py-2.5 text-xs text-content-muted">
              Sponsored placement is managed by advertising administrators. This listing is
              currently {business?.isSponsored ? 'sponsored' : 'not sponsored'}.
            </p>
          </>
        )}
      </Card>

      <Notice state={state} />
      <SubmitButton>{business?.id ? 'Save listing' : 'Create listing'}</SubmitButton>
    </form>
  )
}
