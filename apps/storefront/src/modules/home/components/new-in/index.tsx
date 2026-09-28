import { isStitchingService } from "@lib/brand"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

/** The newest ready-to-wear pieces (stitching services are left out). */
export default async function NewIn({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: { limit: 12, order: "-created_at" },
  })

  const pieces = products.filter((p) => !isStitchingService(p)).slice(0, 6)
  if (!pieces.length) {
    return null
  }

  return (
    <section className="content-container py-12 small:py-16">
      <div className="mb-8 flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <span className="janki-eyebrow">Ready to wear</span>
          <h2 className="janki-h2">New in the boutique</h2>
        </div>
        <InteractiveLink href="/store">Shop all</InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-12 small:grid-cols-3">
        {pieces.map((p) => (
          <li key={p.id}>
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
