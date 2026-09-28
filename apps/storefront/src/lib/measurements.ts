/**
 * Measurement names shared by the storefront forms. Keep in sync with
 * apps/backend/src/modules/stitching/constants.ts (MEASUREMENT_FIELDS).
 */
export const MEASUREMENT_GROUPS: {
  title: string
  fields: { key: string; label: string; hint?: string }[]
}[] = [
  {
    title: "Upper body",
    fields: [
      { key: "bust", label: "Bust", hint: "Around the fullest part" },
      { key: "under_bust", label: "Under bust" },
      { key: "waist", label: "Waist", hint: "Around the natural waist" },
      { key: "hip", label: "Hip", hint: "Around the fullest part" },
      { key: "shoulder", label: "Shoulder", hint: "Shoulder tip to tip" },
      { key: "armhole", label: "Armhole" },
    ],
  },
  {
    title: "Sleeves & lengths",
    fields: [
      { key: "sleeve_length", label: "Sleeve length" },
      { key: "sleeve_round", label: "Sleeve round" },
      { key: "blouse_length", label: "Blouse length" },
      { key: "front_neck_depth", label: "Front neck depth" },
      { key: "back_neck_depth", label: "Back neck depth" },
      { key: "top_length", label: "Kurti / top length" },
    ],
  },
  {
    title: "Bottoms",
    fields: [
      { key: "bottom_waist", label: "Bottom waist" },
      { key: "bottom_length", label: "Bottom length" },
      { key: "thigh", label: "Thigh" },
      { key: "ankle", label: "Ankle round" },
    ],
  },
]

export const MEASUREMENT_LABELS: Record<string, string> = Object.fromEntries(
  MEASUREMENT_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.label]))
)

export type MeasurementProfile = {
  id: string
  name: string
  unit: "in" | "cm"
  measurements: Record<string, number>
  notes: string | null
  updated_at?: string
}

export const APPOINTMENT_TYPES = [
  { value: "bridal_consultation", label: "Bridal consultation" },
  { value: "custom_stitching", label: "Custom stitching" },
  { value: "measurement", label: "Measurement visit" },
  { value: "trial_fitting", label: "Trial fitting" },
  { value: "alteration", label: "Alteration" },
  { value: "video_consultation", label: "Video consultation" },
] as const

export const APPOINTMENT_SLOTS = [
  { value: "morning", label: "Morning (10 am – 1 pm)" },
  { value: "afternoon", label: "Afternoon (1 pm – 4 pm)" },
  { value: "evening", label: "Evening (4 pm – 7 pm)" },
] as const
