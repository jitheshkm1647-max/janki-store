import { Cash, CreditCard } from "@medusajs/icons"
import React from "react"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element; description?: string }
> = {
  pp_cashfree_cashfree: {
    title: "UPI, cards & netbanking",
    icon: <CreditCard />,
    description:
      "Pay securely with Google Pay, PhonePe, Paytm, any UPI app, cards or netbanking via Cashfree.",
  },
  pp_system_default: {
    title: "Cash on Delivery",
    icon: <Cash />,
    description:
      "Pay in cash or UPI when your order is delivered or when you collect it from the studio.",
  },
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

export const isCashfree = (providerId?: string) => {
  return providerId?.startsWith("pp_cashfree")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
