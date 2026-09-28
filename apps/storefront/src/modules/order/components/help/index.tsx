import { BRAND } from "@lib/brand"
import { Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Help = () => {
  return (
    <div className="mt-6">
      <Heading className="text-base-semi">Need help with your order?</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            Call or WhatsApp{" "}
            <span className="select-all font-semibold">{BRAND.phoneDisplay}</span>
          </li>
          <li>
            <a
              href={BRAND.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="text-janki-wine underline-offset-4 hover:underline"
            >
              Message us on WhatsApp
            </a>
          </li>
          <li>
            <LocalizedClientLink
              href="/book-appointment?type=trial_fitting"
              className="text-janki-wine underline-offset-4 hover:underline"
            >
              Book a trial fitting or alteration
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
