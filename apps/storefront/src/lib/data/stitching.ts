"use server"

import { sdk } from "@lib/config"
import { MeasurementProfile, MEASUREMENT_LABELS } from "@lib/measurements"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { addToCart } from "./cart"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export type AppointmentFormState =
  | { state: "idle" }
  | { state: "error"; error: string }
  | { state: "success"; date: string; slot: string }

export async function requestAppointment(
  _prev: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const get = (k: string) => {
    const v = formData.get(k)
    return typeof v === "string" && v.trim() ? v.trim() : null
  }

  const body = {
    type: get("type") ?? "custom_stitching",
    name: get("name"),
    phone: get("phone"),
    email: get("email"),
    preferred_date: get("preferred_date"),
    preferred_slot: get("preferred_slot") ?? "morning",
    event_date: get("event_date"),
    budget_range: get("budget_range"),
    notes: get("notes"),
  }

  if (!body.name || !body.phone || !body.preferred_date) {
    return {
      state: "error",
      error: "Please add your name, phone number and a preferred date.",
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(body.preferred_date) < today) {
    return { state: "error", error: "Please choose a date from today onwards." }
  }

  try {
    await sdk.client.fetch(`/store/appointments`, {
      method: "POST",
      body,
      headers: { ...(await getAuthHeaders()) },
    })
    return {
      state: "success",
      date: body.preferred_date,
      slot: body.preferred_slot,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return {
      state: "error",
      error: message.replace(/^Invalid request:\s*/, ""),
    }
  }
}

// ---------------------------------------------------------------------------
// Measurement profiles
// ---------------------------------------------------------------------------

export async function listMeasurementProfiles(): Promise<MeasurementProfile[]> {
  const authHeaders = await getAuthHeaders()
  if (!("authorization" in authHeaders)) {
    return []
  }

  return sdk.client
    .fetch<{ measurement_profiles: MeasurementProfile[] }>(
      `/store/customers/me/measurements`,
      {
        method: "GET",
        headers: { ...authHeaders },
        next: { ...(await getCacheOptions("measurements")) },
        cache: "force-cache",
      }
    )
    .then(({ measurement_profiles }) => measurement_profiles)
    .catch(() => [])
}

export type MeasurementFormState =
  | { state: "idle" }
  | { state: "error"; error: string }
  | { state: "success" }

export async function saveMeasurementProfile(
  _prev: MeasurementFormState,
  formData: FormData
): Promise<MeasurementFormState> {
  const id = (formData.get("id") as string) || null
  const name = ((formData.get("name") as string) || "").trim()
  const unit = formData.get("unit") === "cm" ? "cm" : "in"
  const notes = ((formData.get("notes") as string) || "").trim() || null

  const measurements: Record<string, number> = {}
  for (const key of Object.keys(MEASUREMENT_LABELS)) {
    const raw = formData.get(`m_${key}`)
    if (typeof raw === "string" && raw.trim() !== "") {
      const value = Number(raw)
      if (!Number.isFinite(value) || value <= 0) {
        return {
          state: "error",
          error: `${MEASUREMENT_LABELS[key]} must be a positive number.`,
        }
      }
      measurements[key] = value
    }
  }

  if (!name) {
    return { state: "error", error: "Give this profile a name, like “Me”." }
  }
  if (!Object.keys(measurements).length) {
    return { state: "error", error: "Add at least one measurement." }
  }

  try {
    await sdk.client.fetch(
      id
        ? `/store/customers/me/measurements/${id}`
        : `/store/customers/me/measurements`,
      {
        method: "POST",
        body: { name, unit, measurements, notes },
        headers: { ...(await getAuthHeaders()) },
      }
    )
  } catch (e) {
    return {
      state: "error",
      error: e instanceof Error ? e.message : String(e),
    }
  }

  revalidateTag(await getCacheTag("measurements"))
  return { state: "success" }
}

export async function deleteMeasurementProfile(id: string) {
  await sdk.client
    .fetch(`/store/customers/me/measurements/${id}`, {
      method: "DELETE",
      headers: { ...(await getAuthHeaders()) },
    })
    .catch(medusaError)
  revalidateTag(await getCacheTag("measurements"))
}

// ---------------------------------------------------------------------------
// Custom stitching cart items
// ---------------------------------------------------------------------------

export type StitchingDetails = {
  measurementMode: "saved_profile" | "studio_visit" | "sample_garment"
  profileId?: string
  designNotes?: string
  referenceLink?: string
  neededBy?: string
}

/**
 * Adds a stitching service to the cart with the customer's measurement and
 * design details stored on the line item, so the workshop sees them on the
 * order. Saved measurements are copied (not linked), so later edits to the
 * profile do not change an order that has already been placed.
 */
export async function addStitchingToCart({
  variantId,
  countryCode,
  details,
}: {
  variantId: string
  countryCode: string
  details: StitchingDetails
}) {
  const metadata: Record<string, unknown> = {
    stitching: true,
    measurement_mode: details.measurementMode,
  }

  if (details.measurementMode === "saved_profile") {
    const profiles = await listMeasurementProfiles()
    const profile = profiles.find((p) => p.id === details.profileId)
    if (!profile) {
      throw new Error("Please choose one of your saved measurement profiles.")
    }
    metadata.measurement_profile_id = profile.id
    metadata.measurement_profile_name = profile.name
    metadata.measurement_unit = profile.unit
    metadata.measurements = profile.measurements
  }

  const clip = (v?: string, n = 500) => (v ? v.trim().slice(0, n) : undefined)
  if (clip(details.designNotes)) metadata.design_notes = clip(details.designNotes)
  if (clip(details.referenceLink, 300)) {
    metadata.reference_link = clip(details.referenceLink, 300)
  }
  if (details.neededBy) metadata.needed_by = details.neededBy

  await addToCart({ variantId, quantity: 1, countryCode, metadata })
}
