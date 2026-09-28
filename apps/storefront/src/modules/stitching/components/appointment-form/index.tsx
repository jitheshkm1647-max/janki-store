"use client"

import { BRAND } from "@lib/brand"
import {
  AppointmentFormState,
  requestAppointment,
} from "@lib/data/stitching"
import { APPOINTMENT_SLOTS, APPOINTMENT_TYPES } from "@lib/measurements"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

const BRIDAL_TYPES = ["bridal_consultation", "video_consultation"]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="janki-btn-primary w-full small:w-auto"
      disabled={pending}
      data-testid="appointment-submit"
    >
      {pending ? "Sending…" : "Request appointment"}
    </button>
  )
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function AppointmentForm({
  defaultType = "custom_stitching",
  defaultName,
  defaultPhone,
  defaultEmail,
}: {
  defaultType?: string
  defaultName?: string
  defaultPhone?: string
  defaultEmail?: string
}) {
  const [state, formAction] = useActionState<AppointmentFormState, FormData>(
    requestAppointment,
    { state: "idle" }
  )
  const [type, setType] = useState(defaultType)
  const isBridal = BRIDAL_TYPES.includes(type)

  if (state.state === "success") {
    const slot = APPOINTMENT_SLOTS.find((s) => s.value === state.slot)
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl border border-janki-gold bg-janki-cream p-6"
        data-testid="appointment-success"
      >
        <span className="janki-eyebrow">Request received</span>
        <h3 className="janki-h3">Thank you. We will call you to confirm.</h3>
        <p className="text-[15px] text-janki-muted">
          You asked for{" "}
          {new Date(state.date).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          , {slot?.label.toLowerCase() ?? state.slot}. Your visit is confirmed
          once we call or WhatsApp you from {BRAND.phoneDisplay}.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="grid gap-4 small:grid-cols-2" noValidate={false}>
      <div className="small:col-span-2">
        <label htmlFor="appt-type" className="janki-label">
          What would you like to book?
        </label>
        <select
          id="appt-type"
          name="type"
          className="janki-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {APPOINTMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="appt-name" className="janki-label">Your name</label>
        <input id="appt-name" name="name" required minLength={2} autoComplete="name" className="janki-input" defaultValue={defaultName} />
      </div>
      <div>
        <label htmlFor="appt-phone" className="janki-label">Mobile / WhatsApp</label>
        <input
          id="appt-phone"
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          pattern="[0-9+\-\s]{10,16}"
          placeholder="+91 98xxx xxxxx"
          className="janki-input"
          defaultValue={defaultPhone}
        />
      </div>
      <div className="small:col-span-2">
        <label htmlFor="appt-email" className="janki-label">
          Email <span className="font-normal text-janki-muted">(optional)</span>
        </label>
        <input id="appt-email" name="email" type="email" autoComplete="email" className="janki-input" defaultValue={defaultEmail} />
      </div>

      <div>
        <label htmlFor="appt-date" className="janki-label">Preferred date</label>
        <input id="appt-date" name="preferred_date" type="date" required min={tomorrow()} className="janki-input" />
      </div>
      <div>
        <label htmlFor="appt-slot" className="janki-label">Preferred time</label>
        <select id="appt-slot" name="preferred_slot" className="janki-input" defaultValue="morning">
          {APPOINTMENT_SLOTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {isBridal && (
        <>
          <div>
            <label htmlFor="appt-event" className="janki-label">Wedding / event date</label>
            <input id="appt-event" name="event_date" type="date" min={tomorrow()} className="janki-input" />
          </div>
          <div>
            <label htmlFor="appt-budget" className="janki-label">Budget range</label>
            <select id="appt-budget" name="budget_range" className="janki-input" defaultValue="">
              <option value="">Prefer to discuss</option>
              <option>Under ₹15,000</option>
              <option>₹15,000 – ₹35,000</option>
              <option>₹35,000 – ₹75,000</option>
              <option>Above ₹75,000</option>
            </select>
          </div>
        </>
      )}

      <div className="small:col-span-2">
        <label htmlFor="appt-notes" className="janki-label">
          Anything we should know? <span className="font-normal text-janki-muted">(optional)</span>
        </label>
        <textarea
          id="appt-notes"
          name="notes"
          rows={3}
          maxLength={2000}
          className="janki-input"
          placeholder={
            isBridal
              ? "Outfits you need, colours you love, reference links…"
              : "What you would like stitched or altered…"
          }
        />
      </div>

      {state.state === "error" && (
        <p role="alert" className="small:col-span-2 text-[14px] text-rose-700">
          {state.error}
        </p>
      )}

      <div className="small:col-span-2 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <SubmitButton />
        <span className="text-[13px] text-janki-muted">
          Prefer to talk? Call or WhatsApp{" "}
          <span className="select-all font-semibold text-janki-ink">{BRAND.phoneDisplay}</span>
        </span>
      </div>
    </form>
  )
}
