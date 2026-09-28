import { cleanMeasurements } from "../../../../../../modules/stitching/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { deleteMeasurementProfileWorkflow } from "../../../../../../workflows/delete-measurement-profile"
import { upsertMeasurementProfileWorkflow } from "../../../../../../workflows/upsert-measurement-profile"
import { StoreUpsertMeasurementProfileType } from "../../../../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<StoreUpsertMeasurementProfileType>,
  res: MedusaResponse
) {
  const { result } = await upsertMeasurementProfileWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      measurements: req.validatedBody.measurements as Record<string, number>,
      id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  })
  res.json({ measurement_profile: cleanMeasurements(result) })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  await deleteMeasurementProfileWorkflow(req.scope).run({
    input: { id: req.params.id, customer_id: req.auth_context.actor_id },
  })
  res.json({ id: req.params.id, object: "measurement_profile", deleted: true })
}
