import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Runs when a customer books a visit from the storefront.
 *
 * Next step for Brandbyte: send a WhatsApp message to the studio and a
 * confirmation to the customer here (for example with the WhatsApp Cloud API
 * or a Notification Module provider).
 */
export default async function appointmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [appointment],
  } = await query.graph({
    entity: "appointment",
    fields: ["id", "type", "name", "phone", "preferred_date", "preferred_slot"],
    filters: { id: data.id },
  })

  if (!appointment) {
    return
  }

  logger.info(
    `New ${appointment.type} request from ${appointment.name} (${appointment.phone}) for ${new Date(
      appointment.preferred_date as unknown as string
    ).toDateString()}, ${appointment.preferred_slot}`
  )
}

export const config: SubscriberConfig = {
  event: "appointment.created",
}
