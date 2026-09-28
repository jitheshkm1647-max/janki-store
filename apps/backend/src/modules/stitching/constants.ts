/**
 * Measurement names used by the storefront form and the admin view.
 * Keep these keys stable: they are stored in measurement_profile.measurements.
 */
export const MEASUREMENT_FIELDS = [
  { key: "bust", label: "Bust" },
  { key: "under_bust", label: "Under bust" },
  { key: "waist", label: "Waist" },
  { key: "hip", label: "Hip" },
  { key: "shoulder", label: "Shoulder" },
  { key: "armhole", label: "Armhole" },
  { key: "sleeve_length", label: "Sleeve length" },
  { key: "sleeve_round", label: "Sleeve round" },
  { key: "blouse_length", label: "Blouse length" },
  { key: "front_neck_depth", label: "Front neck depth" },
  { key: "back_neck_depth", label: "Back neck depth" },
  { key: "top_length", label: "Kurti / top length" },
  { key: "bottom_waist", label: "Bottom waist" },
  { key: "bottom_length", label: "Bottom length" },
  { key: "thigh", label: "Thigh" },
  { key: "ankle", label: "Ankle round" },
] as const

export type MeasurementKey = (typeof MEASUREMENT_FIELDS)[number]["key"]

export const APPOINTMENT_TYPES = [
  "bridal_consultation",
  "custom_stitching",
  "measurement",
  "trial_fitting",
  "alteration",
  "video_consultation",
] as const

export const APPOINTMENT_STATUSES = [
  "requested",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const

export const APPOINTMENT_SLOTS = ["morning", "afternoon", "evening"] as const
