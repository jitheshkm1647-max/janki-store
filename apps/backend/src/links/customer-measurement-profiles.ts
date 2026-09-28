import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import StitchingModule from "../modules/stitching"

/**
 * Read-only link so a customer's measurement profiles can be fetched with
 * Query, e.g. fields: ["measurement_profiles.*"] on the customer entity.
 */
export default defineLink(
  {
    linkable: StitchingModule.linkable.measurementProfile,
    field: "customer_id",
    isList: true,
  },
  CustomerModule.linkable.customer,
  { readOnly: true }
)
