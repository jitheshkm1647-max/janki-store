import { cleanMeasurements } from "../../../../../modules/stitching/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "measurement_profile",
    fields: ["id", "name", "unit", "measurements", "notes", "updated_at"],
    filters: { customer_id: req.params.id },
  })
  res.json({ measurement_profiles: data.map(cleanMeasurements) })
}
