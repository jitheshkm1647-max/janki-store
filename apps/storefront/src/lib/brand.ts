/**
 * Janki Design business details used across the storefront.
 * Update these in one place when anything changes.
 */
export const BRAND = {
  name: "Janki Design",
  tagline: "Where fashion meets craft",
  city: "Kochi",
  area: "Ernakulam, Kochi, Kerala",
  phoneDisplay: "+91 70127 32880",
  phoneE164: "+917012732880",
  whatsappUrl:
    "https://wa.me/917012732880?text=" +
    encodeURIComponent("Hi Janki Design, I have a question about "),
  instagramUrl: "https://www.instagram.com/jankidesign_/",
  instagramHandle: "@jankidesign_",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Janki+Design+Kochi",
  yearsOfCraft: 30,
  hours: "Mon–Sat, 10:00 am – 7:30 pm",
}

export const STITCHING_CATEGORY_HANDLE = "custom-stitching"

export const isStitchingService = (product?: {
  metadata?: Record<string, unknown> | null
}) => Boolean(product?.metadata?.stitching_service)
