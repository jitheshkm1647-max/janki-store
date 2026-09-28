import { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import BridalBand from "@modules/home/components/bridal-band"
import CategoryTiles from "@modules/home/components/category-tiles"
import Hero from "@modules/home/components/hero"
import NewIn from "@modules/home/components/new-in"
import PromiseStrip from "@modules/home/components/promise-strip"
import StitchingSteps from "@modules/home/components/stitching-steps"

export const metadata: Metadata = {
  title: "Janki Design | Bridal & Custom Stitching Boutique, Kochi",
  description:
    "Shop bridal wear, kurtis, co-ord sets and festive collections from Janki Design, Kochi, or order custom stitching made to your measurements.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const [region, categories] = await Promise.all([
    getRegion(countryCode),
    listCategories().catch(() => []),
  ])

  return (
    <>
      <Hero />
      <PromiseStrip />
      <CategoryTiles categories={categories ?? []} />
      {region && <NewIn region={region} />}
      <StitchingSteps />
      <BridalBand />
    </>
  )
}
