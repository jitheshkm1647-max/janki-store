import { model } from "@medusajs/framework/utils"

/**
 * A booking request for the studio: bridal consultations, measurement visits,
 * trial fittings, alterations or a video call.
 */
const Appointment = model.define("appointment", {
  id: model.id({ prefix: "appt" }).primaryKey(),
  type: model
    .enum([
      "bridal_consultation",
      "custom_stitching",
      "measurement",
      "trial_fitting",
      "alteration",
      "video_consultation",
    ])
    .default("custom_stitching"),
  status: model
    .enum(["requested", "confirmed", "completed", "cancelled", "no_show"])
    .default("requested"),
  name: model.text(),
  phone: model.text(),
  email: model.text().nullable(),
  customer_id: model.text().index().nullable(),
  preferred_date: model.dateTime(),
  preferred_slot: model.enum(["morning", "afternoon", "evening"]).default("morning"),
  event_date: model.dateTime().nullable(),
  budget_range: model.text().nullable(),
  notes: model.text().nullable(),
  staff_notes: model.text().nullable(),
})

export default Appointment
