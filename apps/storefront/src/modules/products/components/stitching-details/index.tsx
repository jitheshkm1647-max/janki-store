"use client"

import type { StitchingDetails } from "@lib/data/stitching"
import { MeasurementProfile, MEASUREMENT_LABELS } from "@lib/measurements"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  value: StitchingDetails
  onChange: (next: StitchingDetails) => void
  /** null when the shopper is not signed in */
  profiles: MeasurementProfile[] | null
  turnaroundDays?: number
  disabled?: boolean
}

const MODES: {
  value: StitchingDetails["measurementMode"]
  label: string
  help: string
}[] = [
  {
    value: "saved_profile",
    label: "Use my saved measurements",
    help: "Pick a profile from your account.",
  },
  {
    value: "studio_visit",
    label: "I'll visit the studio to be measured",
    help: "We will call you to fix a time in Ernakulam.",
  },
  {
    value: "sample_garment",
    label: "I'll send a well-fitting garment",
    help: "We copy the fit from a blouse or kurti you already love.",
  },
]

/** Earliest date we can promise, given the service turnaround. */
function minNeededBy(days = 7) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function StitchingDetailsForm({
  value,
  onChange,
  profiles,
  turnaroundDays,
  disabled,
}: Props) {
  const set = (patch: Partial<StitchingDetails>) =>
    onChange({ ...value, ...patch })

  const selectedProfile = profiles?.find((p) => p.id === value.profileId)

  return (
    <fieldset
      className="flex flex-col gap-4 rounded-2xl border border-janki-ink/10 bg-janki-cream p-4"
      disabled={disabled}
    >
      <legend className="sr-only">Stitching details</legend>
      <div className="flex flex-col gap-1">
        <span className="janki-eyebrow">Your fit</span>
        {turnaroundDays ? (
          <span className="text-[13px] text-janki-muted">
            Usually ready in about {turnaroundDays} working days after we have
            your measurements and fabric.
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="How should we get your measurements?">
        {MODES.map((m) => {
          const needsLogin = m.value === "saved_profile" && profiles === null
          const noProfiles =
            m.value === "saved_profile" && profiles !== null && profiles.length === 0
          return (
            <label
              key={m.value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-[14px] ${
                value.measurementMode === m.value
                  ? "border-janki-wine bg-white"
                  : "border-janki-ink/10"
              }`}
            >
              <input
                type="radio"
                name="measurement_mode"
                className="mt-1 accent-janki-wine"
                checked={value.measurementMode === m.value}
                onChange={() => set({ measurementMode: m.value })}
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold text-janki-ink">{m.label}</span>
                <span className="text-janki-muted">
                  {needsLogin ? (
                    <>
                      <LocalizedClientLink href="/account" className="underline">
                        Sign in
                      </LocalizedClientLink>{" "}
                      to use saved measurements.
                    </>
                  ) : noProfiles ? (
                    <>
                      No profiles yet.{" "}
                      <LocalizedClientLink
                        href="/account/measurements"
                        className="underline"
                      >
                        Add your measurements
                      </LocalizedClientLink>
                      .
                    </>
                  ) : (
                    m.help
                  )}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {value.measurementMode === "saved_profile" && !!profiles?.length && (
        <div>
          <label htmlFor="stitch-profile" className="janki-label">
            Measurement profile
          </label>
          <select
            id="stitch-profile"
            className="janki-input"
            value={value.profileId ?? ""}
            onChange={(e) => set({ profileId: e.target.value || undefined })}
          >
            <option value="">Choose a profile</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit === "cm" ? "cm" : "inches"})
              </option>
            ))}
          </select>
          {selectedProfile && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-janki-muted">
              {Object.entries(selectedProfile.measurements)
                .slice(0, 6)
                .map(([k, v]) => `${MEASUREMENT_LABELS[k] ?? k} ${v}`)
                .join(" · ")}
              {Object.keys(selectedProfile.measurements).length > 6 ? " …" : ""}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="stitch-notes" className="janki-label">
          Design notes
        </label>
        <textarea
          id="stitch-notes"
          rows={3}
          maxLength={500}
          className="janki-input"
          placeholder="Neck style, sleeve length, lining, hooks or zip…"
          value={value.designNotes ?? ""}
          onChange={(e) => set({ designNotes: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="stitch-ref" className="janki-label">
          Reference photo link <span className="font-normal text-janki-muted">(optional)</span>
        </label>
        <input
          id="stitch-ref"
          type="url"
          className="janki-input"
          placeholder="Instagram or Pinterest link"
          value={value.referenceLink ?? ""}
          onChange={(e) => set({ referenceLink: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="stitch-date" className="janki-label">
          Needed by <span className="font-normal text-janki-muted">(optional)</span>
        </label>
        <input
          id="stitch-date"
          type="date"
          className="janki-input"
          min={minNeededBy(turnaroundDays)}
          value={value.neededBy ?? ""}
          onChange={(e) => set({ neededBy: e.target.value || undefined })}
        />
      </div>
    </fieldset>
  )
}

export function validateStitchingDetails(
  d: StitchingDetails,
  profiles: MeasurementProfile[] | null
): string | null {
  if (d.measurementMode === "saved_profile") {
    if (!profiles) return "Sign in to use saved measurements, or choose another option."
    if (!d.profileId) return "Choose a measurement profile."
  }
  if (d.referenceLink && !/^https?:\/\//i.test(d.referenceLink.trim())) {
    return "The reference link should start with http:// or https://"
  }
  return null
}
