import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminListAppointmentsType } from "../../validators"

export async function GET(
  req: AuthenticatedMedusaRequest<unknown, AdminListAppointmentsType>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { status, type, limit, offset } = req.validatedQuery

  const filters: Record<string, unknown> = {}
  if (status) {
    filters.status = status
  }
  if (type) {
    filters.type = type
  }

  const { data, metadata } = await query.graph({
    entity: "appointment",
    fields: ["*"],
    filters,
    pagination: {
      skip: offset,
      take: limit,
      order: { preferred_date: "ASC" },
    },
  })

  res.json({
    appointments: data,
    count: metadata?.count ?? data.length,
    limit,
    offset,
  })
}
