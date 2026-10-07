import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Repairs product photos uploaded before the file module knew the public
 * backend address. Those were saved with http://localhost:9000/static/...
 * links, which only work on the server itself and show as broken images.
 * Rewrites them to <MEDUSA_BACKEND_URL>/static/... Safe to run again.
 *
 *   npx medusa exec ./src/scripts/fix-image-urls.ts
 */
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/static\//i

export default async function fixImageUrls({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const base = (process.env.MEDUSA_BACKEND_URL || "").replace(/\/$/, "")
  if (!base || LOCAL.test(`${base}/static/`)) {
    logger.info("MEDUSA_BACKEND_URL is local; nothing to fix.")
    return
  }
  const fix = (url?: string | null) => (url ? url.replace(LOCAL, `${base}/static/`) : url)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail", "images.url", "images.rank"],
  })

  let fixed = 0
  for (const product of products) {
    const images = [...(product.images ?? [])]
      .filter(Boolean)
      .sort((a, b) => (a!.rank ?? 0) - (b!.rank ?? 0))
    const broken =
      LOCAL.test(product.thumbnail ?? "") || images.some((i) => LOCAL.test(i!.url))
    if (!broken) continue

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: {
          thumbnail: fix(product.thumbnail) ?? undefined,
          images: images.map((i) => ({ url: fix(i!.url)! })),
        },
      },
    })
    fixed++
    logger.info(`${product.handle}: photo links repaired`)
  }
  logger.info(fixed ? `Repaired photos on ${fixed} product(s).` : "No broken photo links found.")
}
