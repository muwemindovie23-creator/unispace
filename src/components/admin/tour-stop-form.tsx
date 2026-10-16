'use client'

import { useActionState, useState } from 'react'

import {
  Notice,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from '@/components/admin/form-fields'
import { MapEmbed } from '@/components/site/map-embed'
import { Card } from '@/components/ui/primitives'
import { saveTourStopAction } from '@/modules/tour/actions'
import type { ActionState } from '@/modules/universities/actions'

const INITIAL: ActionState = {}

export interface TourStopFormValues {
  id?: string
  slug: string
  title: string
  description: string
  practicalNote: string | null
  photoUrl: string | null
  mapEmbedUrl: string | null
  latitude: number | null
  longitude: number | null
  placeQuery: string | null
  campusId: string | null
  displayOrder: number
  status: string
  evidenceLevel: string
  sourceNote: string | null
}

export function TourStopForm({
  universityId,
  stop,
  campuses,
  canPublish,
}: {
  universityId: string
  stop?: TourStopFormValues
  campuses: { id: string; name: string }[]
  canPublish: boolean
}) {
  const [state, formAction] = useActionState(saveTourStopAction, INITIAL)

  const [mapEmbedUrl, setMapEmbedUrl] = useState(stop?.mapEmbedUrl ?? '')
  const [latitude, setLatitude] = useState(stop?.latitude?.toString() ?? '')
  const [longitude, setLongitude] = useState(stop?.longitude?.toString() ?? '')
  const [placeQuery, setPlaceQuery] = useState(stop?.placeQuery ?? '')

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="universityId" value={universityId} />
      {stop?.id ? <input type="hidden" name="stopId" value={stop.id} /> : null}

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">The place</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Name" name="title" required defaultValue={stop?.title} />
          <TextField label="URL slug" name="slug" required defaultValue={stop?.slug} />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          rows={4}
          defaultValue={stop?.description}
          hint="What this place is, in plain language. Write it for someone who has never been here."
        />

        <TextAreaField
          label="Worth knowing"
          name="practicalNote"
          rows={3}
          defaultValue={stop?.practicalNote}
          hint="Optional. The practical detail a student would actually want — opening times, which entrance, when it gets busy."
        />

        <TextField
          label="Photo URL"
          name="photoUrl"
          type="url"
          defaultValue={stop?.photoUrl}
          hint="Optional. Only use a photograph you are authorised to publish."
        />
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">On the map</h2>
        <p className="-mt-3 text-xs text-content-muted">
          Give at least one of these. A published stop must have a map, so visitors are never shown
          an empty panel.
        </p>

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
            placeholder="Google Maps → Share → Embed a map"
            aria-describedby="mapEmbedUrl-hint"
            className="w-full rounded-xl border-2 border-hairline bg-surface p-3 font-mono text-xs text-content focus:border-brand focus:outline-none"
          />
          <p id="mapEmbedUrl-hint" className="mt-1.5 text-xs text-content-muted">
            Paste the URL or the whole <code>&lt;iframe&gt;</code> tag. Only Google Maps embeds are
            accepted.
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
              className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="placeQuery" className="mb-1.5 block text-sm font-semibold text-content">
            Place name to search
          </label>
          <input
            id="placeQuery"
            name="placeQuery"
            value={placeQuery}
            onChange={(event) => setPlaceQuery(event.target.value)}
            placeholder="e.g. Chancellor College Library, Zomba"
            aria-describedby="placeQuery-hint"
            className="h-10 w-full rounded-lg border-2 border-hairline bg-surface px-3 text-sm text-content focus:border-brand focus:outline-none"
          />
          <p id="placeQuery-hint" className="mt-1.5 text-xs text-content-muted">
            A last resort — Google picks the result, so check the preview actually shows the right
            place.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-content-muted">
            Preview
          </p>
          <MapEmbed
            source={{
              mapEmbedUrl,
              latitude: latitude.trim() === '' ? null : Number(latitude),
              longitude: longitude.trim() === '' ? null : Number(longitude),
              placeQuery,
            }}
            title="this stop"
            heightClass="h-56"
          />
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="text-base font-bold text-content">Publishing</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Campus"
            name="campusId"
            defaultValue={stop?.campusId ?? ''}
            options={[
              { value: '', label: 'University-wide' },
              ...campuses.map((campus) => ({ value: campus.id, label: campus.name })),
            ]}
          />
          <TextField
            label="Order on the tour"
            name="displayOrder"
            type="number"
            defaultValue={String(stop?.displayOrder ?? 0)}
            hint="Lower numbers come first."
          />
        </div>

        <SelectField
          label="Status"
          name="status"
          defaultValue={stop?.status ?? 'DRAFT'}
          options={[
            { value: 'DRAFT', label: 'Draft — not visible' },
            { value: 'NEEDS_REVIEW', label: 'Needs review' },
            ...(canPublish ? [{ value: 'PUBLISHED', label: 'Published — visible to everyone' }] : []),
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
        />

        <SelectField
          label="How well is this checked?"
          name="evidenceLevel"
          defaultValue={stop?.evidenceLevel ?? 'UNVERIFIED'}
          options={[
            { value: 'UNVERIFIED', label: 'Not yet checked' },
            { value: 'STUDENT_REPORTED', label: 'Student tip — someone’s experience' },
            { value: 'STAFF_CHECKED', label: 'Checked by UniSpace' },
            { value: 'OFFICIAL_SOURCE', label: 'From an official source' },
          ]}
          hint="Shown to visitors as a label. Do not mark something checked that you have not checked."
        />

        <TextAreaField
          label="Source note"
          name="sourceNote"
          rows={2}
          defaultValue={stop?.sourceNote}
          hint="Where this came from, for the next administrator."
        />
      </Card>

      <Notice state={state} />
      <SubmitButton>{stop?.id ? 'Save stop' : 'Add stop'}</SubmitButton>
    </form>
  )
}
