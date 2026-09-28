import { BRAND } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const BRIDAL_STAGES = [
  ["Consultation", "At the studio or on a video call"],
  ["Design & fabric", "Sketches, swatches and a clear quote"],
  ["Trials", "Fittings as your outfit takes shape"],
  ["Ready on time", "Planned back from your wedding date"],
]

export default function BridalBand() {
  return (
    <section className="bg-janki-deep text-janki-ivory">
      <div className="content-container grid gap-10 py-16 small:grid-cols-2 small:items-center small:py-20">
        <div className="flex flex-col gap-4">
          <span className="janki-eyebrow-light">Bridal studio</span>
          <h2 className="janki-h2">Your wedding look, designed with you</h2>
          <p className="max-w-[55ch] text-[16px] leading-relaxed text-janki-ivory/75">
            Start with a one-to-one consultation. We sketch, source fabric,
            stitch and fit your bridal blouse, reception gown or family
            coordinates, with trials along the way.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <LocalizedClientLink href="/bridal" className="janki-btn-gold">
              Plan my bridal look
            </LocalizedClientLink>
            <a
              href={BRAND.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="janki-btn-ghost"
            >
              See our work on Instagram
            </a>
          </div>
        </div>
        <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
          {BRIDAL_STAGES.map(([t, b]) => (
            <li key={t} className="flex flex-col gap-1 bg-janki-deep p-5">
              <span className="font-display text-[20px] text-janki-lemon">
                {t}
              </span>
              <span className="text-[14px] text-janki-ivory/70">{b}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
