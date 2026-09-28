import { Metadata } from "next"

import { BRAND } from "@lib/brand"
import { retrieveCustomer } from "@lib/data/customer"
import AppointmentForm from "@modules/stitching/components/appointment-form"

export const metadata: Metadata = {
  title: "Book a studio visit",
  description:
    "Book a bridal consultation, measurement visit, trial fitting or alteration at Janki Design, Ernakulam.",
}

const TYPES = [
  "bridal_consultation",
  "custom_stitching",
  "measurement",
  "trial_fitting",
  "alteration",
  "video_consultation",
]

export default async function BookAppointment(props: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await props.searchParams
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <div className="content-container grid gap-12 py-12 small:grid-cols-[0.8fr_1.2fr] small:py-20">
      <div className="flex flex-col gap-5">
        <span className="janki-eyebrow">Book a visit</span>
        <h1 className="janki-h1">Come in for a fitting</h1>
        <p className="max-w-[48ch] text-[16px] leading-relaxed text-janki-muted">
          Tell us when suits you and we will confirm by phone or WhatsApp.
          Bring your fabric and any reference pictures.
        </p>
        <dl className="mt-2 grid gap-4 border-t border-janki-ink/10 pt-6 text-[15px]">
          <div>
            <dt className="janki-eyebrow">Studio</dt>
            <dd className="mt-1">{BRAND.area}</dd>
          </div>
          <div>
            <dt className="janki-eyebrow">Hours</dt>
            <dd className="mt-1">{BRAND.hours}</dd>
          </div>
          <div>
            <dt className="janki-eyebrow">Phone & WhatsApp</dt>
            <dd className="mt-1 select-all font-display text-[22px]">{BRAND.phoneDisplay}</dd>
          </div>
          <div>
            <a href={BRAND.mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-janki-wine underline-offset-4 hover:underline">
              Get directions on Google Maps →
            </a>
          </div>
        </dl>
      </div>
      <div className="rounded-3xl border border-janki-ink/10 bg-janki-cream p-5 small:p-8">
        <AppointmentForm
          defaultType={type && TYPES.includes(type) ? type : "custom_stitching"}
          defaultName={[customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || undefined}
          defaultPhone={customer?.phone ?? undefined}
          defaultEmail={customer?.email ?? undefined}
        />
      </div>
    </div>
  )
}
