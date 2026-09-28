"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_total?: number | null
    item_subtotal?: number | null
    shipping_total?: number | null
    shipping_subtotal?: number | null
    discount_total?: number | null
    discount_subtotal?: number | null
    shipping_methods?: unknown[] | null
  }
}

/**
 * Indian prices are shown GST-inclusive (like an MRP), so items and delivery
 * are listed with tax included and GST is shown as "included" underneath.
 */
const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_total,
    item_subtotal,
    shipping_total,
    shipping_subtotal,
    discount_total,
    discount_subtotal,
  } = totals

  const hasShipping = (totals.shipping_methods?.length ?? 0) > 0
  const items = item_total ?? item_subtotal ?? 0
  const shipping = shipping_total ?? shipping_subtotal ?? 0
  const discount = discount_total ?? discount_subtotal ?? 0
  const money = (amount: number) => convertToLocale({ amount, currency_code })

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Items</span>
          <span data-testid="cart-subtotal" data-value={items}>
            {money(items)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span data-testid="cart-shipping" data-value={shipping}>
            {!hasShipping && shipping === 0
              ? "Calculated at checkout"
              : shipping === 0
              ? "Free"
              : money(shipping)}
          </span>
        </div>
        {!!discount && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount}
            >
              - {money(discount)}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-1 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {money(total ?? 0)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[13px] text-ui-fg-subtle">
        <span>Includes GST</span>
        <span data-testid="cart-taxes" data-value={tax_total || 0}>
          {convertToLocale({
            amount: tax_total ?? 0,
            currency_code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
