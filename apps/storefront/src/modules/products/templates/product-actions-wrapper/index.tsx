import { isStitchingService } from "@lib/brand"
import { retrieveCustomer } from "@lib/data/customer"
import { listProducts } from "@lib/data/products"
import { listMeasurementProfiles } from "@lib/data/stitching"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  let measurementProfiles = null
  if (isStitchingService(product)) {
    const customer = await retrieveCustomer().catch(() => null)
    measurementProfiles = customer ? await listMeasurementProfiles() : null
  }

  return (
    <ProductActions
      product={product}
      region={region}
      measurementProfiles={measurementProfiles}
    />
  )
}
