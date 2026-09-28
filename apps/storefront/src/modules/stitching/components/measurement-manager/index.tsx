"use client"

import {
  deleteMeasurementProfile,
  MeasurementFormState,
  saveMeasurementProfile,
} from "@lib/data/stitching"
import {
  MeasurementProfile,
  MEASUREMENT_GROUPS,
  MEASUREMENT_LABELS,
} from "@lib/measurements"
import { useActionState, useEffect, useState, useTransition } from "react"
import { useFormStatus } from "react-dom"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="janki-btn-primary" disabled={pending} data-testid="measurement-save">
      {pending ? "Saving…" : "Save measurements"}
    </button>
  )
}

function ProfileForm({
  profile,
  onDone,
}: {
  profile?: MeasurementProfile
  onDone: () => void
}) {
  const [state, formAction] = useActionState<MeasurementFormState, FormData>(
    saveMeasurementProfile,
    { state: "idle" }
  )
  const [unit, setUnit] = useState<"in" | "cm">(profile?.unit ?? "in")

  useEffect(() => {
    if (state.state === "success") {
      onDone()
    }
  }, [state, onDone])

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl border border-janki-ink/10 bg-white p-5 small:p-7">
      {profile && <input type="hidden" name="id" value={profile.id} />}
      <div className="grid gap-4 small:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="mp-name" className="janki-label">Profile name</label>
          <input
            id="mp-name"
            name="name"
            required
            maxLength={60}
            defaultValue={profile?.name ?? ""}
            placeholder="Me, Amma, Daughter…"
            className="janki-input"
          />
        </div>
        <fieldset>
          <legend className="janki-label">Unit</legend>
          <div className="flex overflow-hidden rounded-lg border border-janki-ink/20">
            {(["in", "cm"] as const).map((u) => (
              <label
                key={u}
                className={`cursor-pointer px-4 py-3 text-[14px] font-semibold ${unit === u ? "bg-janki-wine text-janki-ivory" : "bg-white text-janki-ink"}`}
              >
                <input
                  type="radio"
                  name="unit"
                  value={u}
                  checked={unit === u}
                  onChange={() => setUnit(u)}
                  className="sr-only"
                />
                {u === "in" ? "Inches" : "Centimetres"}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {MEASUREMENT_GROUPS.map((group) => (
        <fieldset key={group.title} className="flex flex-col gap-3">
          <legend className="janki-eyebrow mb-2">{group.title}</legend>
          <div className="grid grid-cols-2 gap-3 small:grid-cols-3">
            {group.fields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`m_${f.key}`} className="janki-label">
                  {f.label}
                </label>
                <div className="relative">
                  <input
                    id={`m_${f.key}`}
                    name={`m_${f.key}`}
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    max="200"
                    defaultValue={profile?.measurements[f.key] ?? ""}
                    className="janki-input pr-10 tabular-nums"
                    aria-describedby={f.hint ? `h_${f.key}` : undefined}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-janki-muted">
                    {unit}
                  </span>
                </div>
                {f.hint && (
                  <span id={`h_${f.key}`} className="mt-1 block text-[12px] text-janki-muted">
                    {f.hint}
                  </span>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div>
        <label htmlFor="mp-notes" className="janki-label">
          Fit notes <span className="font-normal text-janki-muted">(optional)</span>
        </label>
        <textarea
          id="mp-notes"
          name="notes"
          rows={2}
          maxLength={1000}
          defaultValue={profile?.notes ?? ""}
          placeholder="Prefer a slightly loose fit, left shoulder a little lower…"
          className="janki-input"
        />
      </div>

      {state.state === "error" && (
        <p role="alert" className="text-[14px] text-rose-700">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton />
        <button type="button" className="janki-btn-outline" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function MeasurementManager({
  profiles,
}: {
  profiles: MeasurementProfile[]
}) {
  const [editing, setEditing] = useState<string | "new" | null>(
    profiles.length ? null : "new"
  )
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (editing) {
    return (
      <ProfileForm
        profile={profiles.find((p) => p.id === editing)}
        onDone={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-4 small:grid-cols-2">
        {profiles.map((p) => {
          const entries = Object.entries(p.measurements)
          return (
            <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-janki-ink/10 bg-white p-5" data-testid="measurement-profile">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="janki-h3">{p.name}</h3>
                  <span className="text-[13px] text-janki-muted">
                    {entries.length} measurements · {p.unit === "cm" ? "centimetres" : "inches"}
                  </span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[14px]">
                {entries.slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-dashed border-janki-ink/10 py-1">
                    <dt className="text-janki-muted">{MEASUREMENT_LABELS[k] ?? k}</dt>
                    <dd className="tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              {entries.length > 8 && (
                <span className="text-[13px] text-janki-muted">+ {entries.length - 8} more</span>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[14px] font-semibold">
                <button type="button" className="text-janki-wine underline-offset-4 hover:underline" onClick={() => setEditing(p.id)}>
                  Edit
                </button>
                {confirmDelete === p.id ? (
                  <span className="flex items-center gap-3">
                    <span className="font-normal text-janki-muted">Delete this profile?</span>
                    <button
                      type="button"
                      className="text-rose-700"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteMeasurementProfile(p.id)
                          setConfirmDelete(null)
                        })
                      }
                    >
                      {isPending ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button type="button" className="text-janki-muted" onClick={() => setConfirmDelete(null)}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button type="button" className="text-janki-muted hover:text-rose-700" onClick={() => setConfirmDelete(p.id)}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <button type="button" className="janki-btn-outline self-start" onClick={() => setEditing("new")}>
        Add a measurement profile
      </button>
    </div>
  )
}
