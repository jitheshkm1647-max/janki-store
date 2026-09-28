import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import localFont from "next/font/local"
import "styles/globals.css"

// Brand fonts are self-hosted (SIL Open Font License, see ./fonts), so builds
// never depend on reaching Google Fonts.
const display = localFont({
  src: "./fonts/Marcellus-Regular.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
})

const sans = localFont({
  src: "./fonts/Figtree-Variable.woff2",
  weight: "300 900",
  variable: "--font-sans",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Janki Design | Bridal & Custom Stitching Boutique, Kochi",
    template: "%s | Janki Design",
  },
  description:
    "Janki Design is a boutique and custom stitching studio in Kochi. Bridal wear, made-to-measure blouses and kurtis, and festive collections, backed by 30 years of tailoring craft.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      data-mode="light"
      className={`${display.variable} ${sans.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
