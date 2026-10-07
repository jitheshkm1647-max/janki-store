import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"

/**
 * Attaches photo sets from static/catalogue to their products.
 *
 * A file named "<product-handle>-<n>.jpg" (or .png/.webp) belongs to the
 * product with that handle; n sets the order and image 1 becomes the
 * thumbnail. Products without such files are left alone, so this is safe to
 * run again whenever new photos are added.
 *
 *   npx medusa exec ./src/scripts/set-product-images.ts
 */
export default async function setProductImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const dir = path.resolve(process.cwd(), "static/catalogue")
  if (!fs.existsSync(dir)) {
    logger.warn(`No catalogue folder at ${dir}`)
    return
  }
  const baseUrl = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

  const sets = new Map<string, { n: number; file: string }[]>()
  for (const file of fs.readdirSync(dir)) {
    const m = file.match(/^(.+)-(\d+)\.(jpe?g|png|webp)$/i)
    if (!m) continue
    const list = sets.get(m[1]) ?? []
    list.push({ n: Number(m[2]), file })
    sets.set(m[1], list)
  }
  if (!sets.size) {
    logger.info("No numbered photo sets found.")
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail", "images.url"],
    filters: { handle: [...sets.keys()] },
  })

  for (const product of products) {
    const files = (sets.get(product.handle) ?? []).sort((a, b) => a.n - b.n)
    const urls = files.map((f) => `${baseUrl}/static/catalogue/${f.file}`)
    const current = (product.images ?? []).map((i) => i?.url)
    // Photos uploaded in the admin win: only replace starter images.
    if (current.some((u) => u && !u.includes("/static/catalogue/"))) {
      logger.info(`${product.handle}: has photos uploaded in the admin, skipped`)
      continue
    }
    if (product.thumbnail === urls[0] && JSON.stringify(current) === JSON.stringify(urls)) {
      logger.info(`${product.handle}: already up to date`)
      continue
    }
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: { thumbnail: urls[0], images: urls.map((url) => ({ url })) },
      },
    })
    logger.info(`${product.handle}: ${urls.length} photos set`)
  }

  const missing = [...sets.keys()].filter((h) => !products.some((p) => p.handle === h))
  if (missing.length) {
    logger.warn(`No product found for: ${missing.join(", ")}`)
  }
}
