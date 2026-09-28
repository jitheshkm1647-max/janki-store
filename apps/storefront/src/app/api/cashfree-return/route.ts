import { sdk } from "@lib/config"
import { placeOrder } from "@lib/data/cart"
import { getAuthHeaders, setCartId } from "@lib/data/cookies"
import { HttpTypes } from "@medusajs/types"
import { unstable_rethrow } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

/**
 * Cashfree sends the customer here after checkout. We confirm the cart has a
 * Cashfree payment session, then complete the cart. Medusa asks Cashfree
 * whether the order was paid before creating the order, so a customer who
 * cancelled or failed payment is sent back to the payment step.
 */
export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl

  const cartId = searchParams.get("cart_id")
  const countryCode = searchParams.get("country_code")
  const prefix = countryCode ? `/${countryCode}` : ""

  if (!cartId) {
    return NextResponse.redirect(`${origin}${prefix}/cart?error=payment_failed`)
  }

  const cart = await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
      method: "GET",
      query: { fields: "id,payment_collection.payment_sessions.*" },
      headers: { ...(await getAuthHeaders()) },
      cache: "no-store",
    })
    .then(({ cart }) => cart)
    .catch(() => null)

  const session = cart?.payment_collection?.payment_sessions?.find((s) =>
    s.provider_id.startsWith("pp_cashfree")
  )

  if (!cart || !session) {
    // The cart may already have been completed by Cashfree's webhook.
    return NextResponse.redirect(`${origin}${prefix}/account/orders`)
  }

  await setCartId(cartId)

  try {
    await placeOrder(cartId)
  } catch (error) {
    unstable_rethrow(error)

    const params = new URLSearchParams({
      step: "review",
      payment_error: "Your payment was not completed. Please try again or choose Cash on Delivery.",
    })
    return NextResponse.redirect(`${origin}${prefix}/checkout?${params}`)
  }

  return NextResponse.redirect(`${origin}${prefix}/cart?error=order_failed`)
}
