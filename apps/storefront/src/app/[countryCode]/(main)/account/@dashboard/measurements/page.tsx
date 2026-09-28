import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import { listMeasurementProfiles } from "@lib/data/stitching"
import MeasurementManager from "@modules/stitching/components/measurement-manager"

export const metadata: Metadata = {
  title: "Measurements",
  description: "Save your measurements for custom stitching orders.",
}

export default async function Measurements() {
  const customer = await retrieveCustomer()
  if (!customer) {
    notFound()
  }
  const profiles = await listMeasurementProfiles()

  return (
    <div className="w-full" data-testid="measurements-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-3">
        <h1 className="janki-h2">Your measurements</h1>
        <p className="max-w-[60ch] text-[15px] text-janki-muted">
          Save a profile once and choose it whenever you order custom
          stitching. Keep separate profiles for family members. Not sure how
          to measure? Book a measurement visit and we will do it for you.
        </p>
      </div>
      <MeasurementManager profiles={profiles} />
    </div>
  )
}
