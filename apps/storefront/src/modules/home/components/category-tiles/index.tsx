import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const TILE_COPY: Record<string, { blurb: string; tone: string }> = {
  bridal: {
    blurb: "Reception gowns, bridal blouses and trousseau",
    tone: "bg-janki-wine text-janki-ivory",
  },
  "kurtis-dresses": {
    blurb: "Everyday kurtis and occasion dresses",
    tone: "bg-janki-cream text-janki-ink",
  },
  "co-ord-sets": {
    blurb: "Easy two-piece sets for Kerala weather",
    tone: "bg-janki-paper-2 text-janki-ink",
  },
  festive: {
    blurb: "Kasavu, set sarees and Onam looks",
    tone: "bg-[#EBD9AE] text-janki-ink",
  },
  kids: {
    blurb: "Pattu pavada and festive sets for little ones",
    tone: "bg-janki-cream text-janki-ink",
  },
  "custom-stitching": {
    blurb: "Blouses, churidars and kurtis stitched to fit",
    tone: "bg-janki-deep text-janki-ivory",
  },
}

export default function CategoryTiles({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) {
  const tiles = categories.filter((c) => !c.parent_category)
  if (!tiles.length) {
    return null
  }

  return (
    <section className="content-container py-14 small:py-20">
      <div className="mb-8 flex flex-col gap-2">
        <span className="janki-eyebrow">Shop by category</span>
        <h2 className="janki-h2">Find your next favourite</h2>
      </div>
      <ul className="grid grid-cols-2 gap-3 small:grid-cols-3 small:gap-4">
        {tiles.map((c) => {
          const copy = TILE_COPY[c.handle] ?? {
            blurb: "",
            tone: "bg-janki-cream text-janki-ink",
          }
          const href =
            c.handle === "custom-stitching"
              ? "/custom-stitching"
              : `/categories/${c.handle}`
          return (
            <li key={c.id}>
              <LocalizedClientLink
                href={href}
                className={`group flex h-full min-h-[150px] flex-col justify-between gap-6 rounded-2xl border border-janki-ink/10 p-5 transition-transform hover:-translate-y-0.5 small:min-h-[190px] small:p-7 ${copy.tone}`}
              >
                <span className="font-display text-[24px] leading-tight small:text-[30px]">
                  {c.name}
                </span>
                <span className="flex items-end justify-between gap-3 text-[14px] opacity-80">
                  <span>{copy.blurb}</span>
                  <span
                    aria-hidden="true"
                    className="text-[20px] transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
