import { BRAND } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-janki-wine text-janki-ivory">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_85%_20%,rgba(160,40,70,0.45),transparent_60%)]"
        aria-hidden="true"
      />
      <div className="content-container relative grid items-end gap-10 pt-12 small:grid-cols-[1.1fr_0.9fr] small:pt-16">
        <div className="flex flex-col gap-6 pb-12 small:pb-20">
          <span className="janki-eyebrow-light">
            Boutique &amp; custom stitching · {BRAND.city}
          </span>
          <h1 className="janki-h1 uppercase">
            Made to measure.
            <br />
            <span className="text-janki-lemon">Made in Kochi.</span>
          </h1>
          <p className="max-w-[52ch] text-[17px] leading-relaxed text-janki-ivory/80">
            Bridal wear, designer blouses and festive collections, cut and
            finished by hands with {BRAND.yearsOfCraft} years of tailoring
            behind them. Shop ready-to-wear online, or send us your
            measurements and we will stitch to fit.
          </p>
          <div className="flex flex-wrap gap-3">
            <LocalizedClientLink href="/store" className="janki-btn-gold">
              Shop the collection
            </LocalizedClientLink>
            <LocalizedClientLink href="/bridal" className="janki-btn-ghost">
              Book a bridal consultation
            </LocalizedClientLink>
          </div>
        </div>
        <div className="relative -mx-6 h-[420px] small:mx-0 small:h-[560px]">
          <Image
            src="/brand/studio-gown.jpg"
            alt="A wine-red draped gown on a mannequin at the Janki Design studio"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover object-top [mask-image:linear-gradient(180deg,transparent_0,#000_18%)] small:[mask-image:linear-gradient(90deg,transparent_0,#000_22%)]"
          />
          <div className="absolute bottom-8 left-6 max-w-[220px] rounded-2xl border border-janki-gold bg-janki-deep/85 p-4 backdrop-blur-sm small:left-0">
            <span className="block font-display text-[44px] leading-none text-janki-lemon">
              {BRAND.yearsOfCraft}
            </span>
            <span className="text-[13px] text-janki-ivory/80">
              years of tailoring craft behind every piece
            </span>
          </div>
        </div>
      </div>
      <div className="janki-tape" aria-hidden="true" />
    </section>
  )
}

export default Hero
