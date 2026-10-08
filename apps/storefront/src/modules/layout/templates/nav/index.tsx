import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/store" },
  { label: "Bridal", href: "/bridal" },
  { label: "Custom Stitching", href: "/custom-stitching" },
  { label: "Book a Visit", href: "/book-appointment" },
]

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-[68px] mx-auto bg-janki-wine text-janki-ivory border-b border-white/10">
        <nav className="content-container flex items-center justify-between w-full h-full text-[14px] font-medium [&_a:hover]:text-janki-lemon [&_button:hover]:text-janki-lemon">
          <div className="flex-1 basis-0 h-full flex items-center gap-x-8">
            <div className="h-full small:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>
            <ul className="hidden small:flex items-center gap-x-6 whitespace-nowrap">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink href={l.href}>{l.label}</LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center"
              data-testid="nav-store-link"
              aria-label="Janki Design home"
            >
              <Image
                src="/brand/janki-logo-yellow.png"
                alt="Janki Design"
                width={92}
                height={53}
                priority
              />
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <Search />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink href="/account" data-testid="nav-account-link">
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
