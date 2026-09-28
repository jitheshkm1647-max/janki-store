import { cleanMeasurements } from "../../../../../modules/stitching/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { upsertMeasurementProfileWorkflow } from "../../../../../workflows/upsert-measurement-profile"
import { StoreUpsertMeasurementProfileType } from "../../../../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "measurement_profile",
    fields: ["id", "name", "unit", "measurements", "notes", "updated_at"],
    filters: { customer_id: req.auth_context.actor_id },
  })
  res.json({ measurement_profiles: data.map(cleanMeasurements) })
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreUpsertMeasurementProfileType>,
  res: MedusaResponse
) {
  const { result } = await upsertMeasurementProfileWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      measurements: req.validatedBody.measurements as Record<string, number>,
      customer_id: req.auth_context.actor_id,
    },
  })
  res.status(201).json({ measurement_profile: cleanMeasurements(result) })
}
