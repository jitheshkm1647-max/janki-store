export type CashfreeEnvironment = "sandbox" | "production"

export type CashfreeOptions = {
  /** Cashfree App ID (x-client-id) */
  clientId: string
  /** Cashfree Secret Key (x-client-secret). Also used to verify webhooks. */
  clientSecret: string
  /** "sandbox" while testing, "production" when live. Defaults to "sandbox". */
  environment?: CashfreeEnvironment
  /** Overrides the Cashfree API base URL. Only for tests with a mock server. */
  apiBaseUrl?: string
  /** Cashfree API version header. Defaults to "2025-01-01". */
  apiVersion?: string
  /**
   * Public URL of the storefront (for example https://jankidesign.com).
   * Return URLs sent by the storefront must start with this value.
   */
  storefrontUrl?: string
  /**
   * Public URL of this Medusa server. When set, Cashfree is told to send
   * payment webhooks to <backendUrl>/hooks/payment/cashfree_cashfree.
   */
  backendUrl?: string
}

export type CashfreeOrderStatus =
  | "ACTIVE"
  | "PAID"
  | "EXPIRED"
  | "TERMINATED"
  | "TERMINATION_REQUESTED"

export type CashfreeOrder = {
  cf_order_id: string | number
  order_id: string
  order_amount: number
  order_currency: string
  order_status: CashfreeOrderStatus
  payment_session_id: string
  order_tags?: Record<string, string> | null
}

export type CashfreeRefund = {
  cf_refund_id: string | number
  refund_id: string
  refund_amount: number
  refund_status: string
}

/** Data the storefront sends when it starts a Cashfree payment session. */
export type CashfreeInitiateData = {
  session_id?: string
  customer_phone?: string
  customer_email?: string
  customer_name?: string
  return_url?: string
}

/** What we keep in the Medusa payment session's `data`. */
export type CashfreeSessionData = {
  session_id: string
  order_id: string
  cf_order_id: string
  payment_session_id: string
  order_amount: number
  order_currency: string
  order_status: CashfreeOrderStatus
  customer_phone: string
  customer_email?: string
  customer_name?: string
  return_url?: string
}
