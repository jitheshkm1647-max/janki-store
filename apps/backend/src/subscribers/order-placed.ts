import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Runs for every new order. Custom stitching items carry their measurement
 * and design details in line item metadata, so the workshop can see them.
 *
 * Next step for Brandbyte: send the order confirmation by email/WhatsApp and
 * create a job card for each custom stitching item.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "items.title", "items.metadata"],
    filters: { id: data.id },
  })

  if (!order) {
    return
  }

  const stitchingItems = (order.items ?? []).filter(
    (item) => item?.metadata?.stitching === true
  )

  logger.info(
    `Order #${order.display_id} placed by ${order.email}` +
      (stitchingItems.length
        ? ` with ${stitchingItems.length} custom stitching item(s)`
        : "")
  )
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
