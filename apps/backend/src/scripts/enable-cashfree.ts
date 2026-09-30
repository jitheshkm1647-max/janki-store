import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const CASHFREE_PROVIDER_ID = "pp_cashfree_cashfree"

/**
 * Turns Cashfree on as a payment option for every region, keeping the
 * providers a region already has (for example Cash on Delivery).
 * Needs CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET to be set.
 *
 *   npx medusa exec ./src/scripts/enable-cashfree.ts
 */
export default async function enableCashfree({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: providers } = await query.graph({
    entity: "payment_provider",
    fields: ["id", "is_enabled"],
  })
  if (!providers.some((p) => p.id === CASHFREE_PROVIDER_ID)) {
    throw new Error(
      "Cashfree is not loaded. Check that CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET are set, then restart the backend."
    )
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
  })

  for (const region of regions) {
    const current = (region.payment_providers ?? [])
      .map((p) => p?.id)
      .filter((id): id is string => Boolean(id))
    if (current.includes(CASHFREE_PROVIDER_ID)) {
      logger.info(`Cashfree already enabled in ${region.name}`)
      continue
    }
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: [...current, CASHFREE_PROVIDER_ID] },
      },
    })
    logger.info(`Cashfree enabled in ${region.name}`)
  }
}
