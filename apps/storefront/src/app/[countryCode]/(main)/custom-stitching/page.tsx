import { Metadata } from "next"

import { STITCHING_CATEGORY_HANDLE } from "@lib/brand"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StitchingSteps from "@modules/home/components/stitching-steps"
import ProductPreview from "@modules/products/components/product-preview"

export const metadata: Metadata = {
  title: "Custom Stitching",
  description:
    "Blouse, churidar, kurti and kids' pavada stitching made to your measurements at Janki Design, Kochi. Order online or visit the studio.",
}

export default async function CustomStitchingPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const [region, categories] = await Promise.all([
    getRegion(countryCode),
    listCategories().catch(() => []),
  ])
  const category = categories?.find((c) => c.handle === STITCHING_CATEGORY_HANDLE)

  const services =
    region && category
      ? await listProducts({
          regionId: region.id,
          queryParams: { category_id: [category.id], limit: 24 },
        }).then(({ response }) => response.products)
      : []

  return (
    <>
      <section className="bg-janki-deep text-janki-ivory">
        <div className="content-container flex flex-col gap-5 py-14 small:py-20">
          <span className="janki-eyebrow-light">Custom stitching</span>
          <h1 className="janki-h1 max-w-[16ch]">Stitched to your measurements</h1>
          <p className="max-w-[60ch] text-[17px] leading-relaxed text-janki-ivory/80">
            Choose a service, tell us how to get your measurements, and add
            your design notes. Pay online or on delivery. Bring or courier your
            fabric, or ask us to source it.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#services" className="janki-btn-gold">See services and prices</a>
            <LocalizedClientLink href="/account/measurements" className="janki-btn-ghost">
              Save my measurements
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      <StitchingSteps showCta={false} />

      <section id="services" className="content-container py-14 small:py-20">
        <div className="mb-8 flex flex-col gap-2 small:flex-row small:items-end small:justify-between">
          <div className="flex flex-col gap-2">
            <span className="janki-eyebrow">Services</span>
            <h2 className="janki-h2">Choose what to stitch</h2>
          </div>
          <LocalizedClientLink href="/book-appointment?type=measurement" className="font-semibold text-janki-wine underline-offset-4 hover:underline">
            Need measuring first? Book a visit →
          </LocalizedClientLink>
        </div>
        {region && services.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-12 small:grid-cols-3">
            {services.map((p) => (
              <li key={p.id}>
                <ProductPreview product={p} region={region} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-janki-muted">Stitching services will appear here once they are published in the admin.</p>
        )}
      </section>
    </>
  )
}
