import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createAppointmentWorkflow } from "../../../workflows/create-appointment"
import { StoreCreateAppointmentType } from "../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreateAppointmentType>,
  res: MedusaResponse
) {
  const body = req.validatedBody
  const { result } = await createAppointmentWorkflow(req.scope).run({
    input: {
      ...body,
      customer_id: req.auth_context?.actor_id ?? null,
    },
  })

  res.status(201).json({
    appointment: {
      id: result.id,
      type: result.type,
      status: result.status,
      preferred_date: result.preferred_date,
      preferred_slot: result.preferred_slot,
    },
  })
}
