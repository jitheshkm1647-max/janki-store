import { Metadata } from "next"
import Image from "next/image"

import { BRAND } from "@lib/brand"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { BRIDAL_STAGES } from "@modules/home/components/bridal-band"
import ProductPreview from "@modules/products/components/product-preview"
import AppointmentForm from "@modules/stitching/components/appointment-form"

export const metadata: Metadata = {
  title: "Bridal",
  description:
    "Custom bridal blouses, reception gowns and family coordination from Janki Design, Kochi. Book a bridal consultation.",
}

export default async function BridalPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const [region, categories] = await Promise.all([
    getRegion(countryCode),
    listCategories().catch(() => []),
  ])
  const bridal = categories?.find((c) => c.handle === "bridal")

  const products =
    region && bridal
      ? await listProducts({
          regionId: region.id,
          queryParams: { category_id: [bridal.id], limit: 6 },
        }).then(({ response }) => response.products)
      : []

  return (
    <>
      <section className="bg-janki-wine text-janki-ivory">
        <div className="content-container grid items-center gap-10 py-14 small:grid-cols-2 small:py-20">
          <div className="flex flex-col gap-5">
            <span className="janki-eyebrow-light">Bridal studio · {BRAND.city}</span>
            <h1 className="janki-h1">Bridal wear, made around you</h1>
            <p className="max-w-[52ch] text-[17px] leading-relaxed text-janki-ivory/80">
              Bridal blouses with hand Aari work, reception gowns and
              coordinated outfits for the family. Every piece is designed with
              you and fitted in our Ernakulam studio.
            </p>
            <a href="#consultation" className="janki-btn-gold self-start">
              Book a bridal consultation
            </a>
          </div>
          <div className="relative h-[380px] overflow-hidden rounded-3xl small:h-[480px]">
            <Image
              src="/brand/studio-gown.jpg"
              alt="Wine velvet reception gown at the Janki Design studio"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      </section>

      <section className="content-container py-14 small:py-20">
        <div className="mb-8 flex flex-col gap-2">
          <span className="janki-eyebrow">How it works</span>
          <h2 className="janki-h2">From first sketch to your big day</h2>
        </div>
        <ol className="grid gap-6 small:grid-cols-4">
          {BRIDAL_STAGES.map(([t, b], i) => (
            <li key={t} className="flex flex-col gap-2 border-t-2 border-janki-gold pt-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-janki-gold-dark">
                Stage {i + 1}
              </span>
              <h3 className="janki-h3">{t}</h3>
              <p className="text-[15px] text-janki-muted">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      {products.length > 0 && region && (
        <section className="content-container pb-14 small:pb-20">
          <h2 className="janki-h2 mb-8">Bridal pieces to order online</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-12 small:grid-cols-3">
            {products.map((p) => (
              <li key={p.id}>
                <ProductPreview product={p} region={region} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="consultation" className="bg-janki-paper-2">
        <div className="content-container grid gap-10 py-14 small:grid-cols-[0.8fr_1.2fr] small:py-20">
          <div className="flex flex-col gap-4">
            <span className="janki-eyebrow">Consultation</span>
            <h2 className="janki-h2">Tell us about your wedding</h2>
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-janki-muted">
              Share your date and what you need. We will call to set up a
              studio visit or a video call, and talk through designs, fabric
              and budget.
            </p>
          </div>
          <div className="rounded-3xl border border-janki-ink/10 bg-janki-cream p-5 small:p-8">
            <AppointmentForm defaultType="bridal_consultation" />
          </div>
        </div>
      </section>
    </>
  )
}
