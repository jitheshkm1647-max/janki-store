import { model } from "@medusajs/framework/utils"

/**
 * A saved set of body measurements. A customer can keep several profiles,
 * for example "Me", "Amma" or "Daughter".
 *
 * `measurements` holds numbers keyed by the measurement name (see
 * MEASUREMENT_FIELDS in ../constants.ts), in the profile's unit.
 */
const MeasurementProfile = model.define("measurement_profile", {
  id: model.id({ prefix: "meas" }).primaryKey(),
  customer_id: model.text().index(),
  name: model.text(),
  unit: model.enum(["in", "cm"]).default("in"),
  measurements: model.json(),
  notes: model.text().nullable(),
})

export default MeasurementProfile
