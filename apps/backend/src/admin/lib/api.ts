/**
 * Small fetch helper for admin extensions. The admin dashboard is served by
 * the Medusa server, so the session cookie is sent automatically.
 */
const BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? ""

export async function adminFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  bridal_consultation: "Bridal consultation",
  custom_stitching: "Custom stitching",
  measurement: "Measurement visit",
  trial_fitting: "Trial fitting",
  alteration: "Alteration",
  video_consultation: "Video consultation",
}

export const MEASUREMENT_LABELS: Record<string, string> = {
  bust: "Bust",
  under_bust: "Under bust",
  waist: "Waist",
  hip: "Hip",
  shoulder: "Shoulder",
  armhole: "Armhole",
  sleeve_length: "Sleeve length",
  sleeve_round: "Sleeve round",
  blouse_length: "Blouse length",
  front_neck_depth: "Front neck depth",
  back_neck_depth: "Back neck depth",
  top_length: "Kurti / top length",
  bottom_waist: "Bottom waist",
  bottom_length: "Bottom length",
  thigh: "Thigh",
  ankle: "Ankle round",
}
