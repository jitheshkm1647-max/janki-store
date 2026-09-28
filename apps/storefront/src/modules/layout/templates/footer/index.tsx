import { BRAND } from "@lib/brand"
import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

export default async function Footer() {
  const productCategories = await listCategories().catch(() => [])
  const topLevel = (productCategories ?? []).filter((c) => !c.parent_category)

  return (
    <footer className="w-full bg-janki-deep text-janki-ivory">
      <div className="janki-tape" aria-hidden="true" />
      <div className="content-container grid gap-12 py-16 small:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <Image
            src="/brand/janki-logo-yellow.png"
            alt="Janki Design"
            width={150}
            height={87}
          />
          <p className="max-w-[34ch] text-[15px] leading-relaxed text-janki-ivory/75">
            A boutique and custom stitching studio in {BRAND.city}, built on{" "}
            {BRAND.yearsOfCraft} years of tailoring craft.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="janki-eyebrow-light">Shop</span>
          <ul className="flex flex-col gap-2 text-[15px] text-janki-ivory/80" data-testid="footer-categories">
            {topLevel.slice(0, 6).map((c) => (
              <li key={c.id}>
                <LocalizedClientLink
                  className="hover:text-janki-lemon"
                  href={`/categories/${c.handle}`}
                  data-testid="category-link"
                >
                  {c.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <span className="janki-eyebrow-light">Services</span>
          <ul className="flex flex-col gap-2 text-[15px] text-janki-ivory/80">
            <li><LocalizedClientLink className="hover:text-janki-lemon" href="/bridal">Bridal consultations</LocalizedClientLink></li>
            <li><LocalizedClientLink className="hover:text-janki-lemon" href="/custom-stitching">Custom stitching</LocalizedClientLink></li>
            <li><LocalizedClientLink className="hover:text-janki-lemon" href="/book-appointment">Book a studio visit</LocalizedClientLink></li>
            <li><LocalizedClientLink className="hover:text-janki-lemon" href="/account/measurements">My measurements</LocalizedClientLink></li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <span className="janki-eyebrow-light">Visit the studio</span>
          <p className="text-[15px] text-janki-ivory/80">{BRAND.area}</p>
          <p className="text-[15px] text-janki-ivory/80">{BRAND.hours}</p>
          <p className="font-display text-[24px] select-all">{BRAND.phoneDisplay}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold text-janki-gold">
            <a className="hover:text-janki-lemon" href={BRAND.whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="hover:text-janki-lemon" href={BRAND.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
            <a className="hover:text-janki-lemon" href={BRAND.mapsUrl} target="_blank" rel="noreferrer">Google Maps</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="content-container flex flex-col gap-2 py-6 text-[13px] text-janki-rose small:flex-row small:justify-between">
          <span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
          <span>Prices in INR and include GST. Cash on Delivery and UPI accepted.</span>
        </div>
      </div>
    </footer>
  )
}
