import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const STITCHING_STEPS = [
  {
    title: "Choose a service",
    body: "Blouse, churidar, kurti or kids' pavada. Pick a style and see the price upfront.",
  },
  {
    title: "Share your measurements",
    body: "Use a saved profile, send a well-fitting sample garment, or visit the studio.",
  },
  {
    title: "We cut and stitch",
    body: "Your piece is made in our Ernakulam workshop. We message you on WhatsApp with updates.",
  },
  {
    title: "Delivery or fitting",
    body: "Collect from the studio with a trial, or have it delivered to your door.",
  },
]

export default function StitchingSteps({
  showCta = true,
}: {
  showCta?: boolean
}) {
  return (
    <section className="bg-janki-cream">
      <div className="content-container py-14 small:py-20">
        <div className="mb-10 flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div className="flex flex-col gap-2">
            <span className="janki-eyebrow">Custom stitching</span>
            <h2 className="janki-h2">How made-to-measure works</h2>
          </div>
          {showCta && (
            <LocalizedClientLink
              href="/custom-stitching"
              className="janki-btn-outline self-start"
            >
              See stitching services
            </LocalizedClientLink>
          )}
        </div>
        <ol className="grid gap-8 small:grid-cols-4">
          {STITCHING_STEPS.map((s, i) => (
            <li
              key={s.title}
              className="flex flex-col gap-2 border-t-2 border-janki-gold pt-4"
            >
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-janki-gold-dark">
                Step {i + 1}
              </span>
              <h3 className="janki-h3">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-janki-muted">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
