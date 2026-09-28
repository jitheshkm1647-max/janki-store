import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateAppointmentWorkflow } from "../../../../workflows/update-appointment"
import { AdminUpdateAppointmentType } from "../../../validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [appointment],
  } = await query.graph(
    {
      entity: "appointment",
      fields: ["*"],
      filters: { id: req.params.id },
    },
    { throwIfKeyNotFound: true }
  )
  res.json({ appointment })
}

export async function POST(
  req: AuthenticatedMedusaRequest<AdminUpdateAppointmentType>,
  res: MedusaResponse
) {
  const { result } = await updateAppointmentWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  res.json({ appointment: result })
}
