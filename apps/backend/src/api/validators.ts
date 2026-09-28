import { z } from "@medusajs/framework/zod"
import {
  APPOINTMENT_SLOTS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  MEASUREMENT_FIELDS,
} from "../modules/stitching/constants"

const measurementKeys: string[] = MEASUREMENT_FIELDS.map((f) => f.key)

export const StoreCreateAppointment = z.object({
  type: z.enum(APPOINTMENT_TYPES),
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,16}$/, "Enter a valid phone number"),
  email: z.string().trim().email().optional().nullable(),
  preferred_date: z.coerce.date(),
  preferred_slot: z.enum(APPOINTMENT_SLOTS),
  event_date: z.coerce.date().optional().nullable(),
  budget_range: z.string().max(60).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})
export type StoreCreateAppointmentType = z.infer<typeof StoreCreateAppointment>

export const StoreUpsertMeasurementProfile = z.object({
  name: z.string().trim().min(1).max(60),
  unit: z.enum(["in", "cm"]).default("in"),
  measurements: z
    .record(z.string(), z.number().positive().max(200))
    .refine(
      (m) => Object.keys(m).every((k) => measurementKeys.includes(k)),
      { message: "Unknown measurement name" }
    ),
  notes: z.string().max(1000).optional().nullable(),
})
export type StoreUpsertMeasurementProfileType = z.infer<
  typeof StoreUpsertMeasurementProfile
>

export const AdminListAppointments = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  type: z.enum(APPOINTMENT_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
export type AdminListAppointmentsType = z.infer<typeof AdminListAppointments>

export const AdminUpdateAppointment = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  preferred_date: z.coerce.date().optional(),
  preferred_slot: z.enum(APPOINTMENT_SLOTS).optional(),
  staff_notes: z.string().max(2000).optional().nullable(),
})
export type AdminUpdateAppointmentType = z.infer<typeof AdminUpdateAppointment>
