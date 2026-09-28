import crypto from "crypto"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import type {
  CashfreeInitiateData,
  CashfreeOptions,
  CashfreeOrder,
  CashfreeOrderStatus,
  CashfreeRefund,
  CashfreeSessionData,
} from "./types"

type InjectedDependencies = {
  logger: Logger
}

const BASE_URLS = {
  sandbox: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
}

/** Webhooks older than this are rejected to limit replay attacks. */
const WEBHOOK_TOLERANCE_MS = 10 * 60 * 1000

/**
 * Cashfree Payment Gateway provider for Medusa v2.
 *
 * Flow:
 * 1. The storefront starts a payment session and passes the customer's phone,
 *    email, name and a return URL. We create a Cashfree order and hand back
 *    its `payment_session_id`.
 * 2. The storefront opens Cashfree Checkout (cashfree.js) with that id. The
 *    customer pays by UPI, card, netbanking or wallet.
 * 3. Cashfree redirects to the return URL; the storefront completes the cart.
 *    Medusa calls `authorizePayment`, which asks Cashfree whether the order is
 *    PAID. Cashfree captures on success, so we report "captured".
 * 4. Cashfree also sends a webhook to /hooks/payment/cashfree_cashfree, which
 *    completes the order even if the customer closed the tab after paying.
 */
class CashfreePaymentProviderService extends AbstractPaymentProvider<CashfreeOptions> {
  static identifier = "cashfree"

  protected logger_: Logger
  protected options_: CashfreeOptions

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.clientId || !options.clientSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree: clientId and clientSecret are required. Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET."
      )
    }
  }

  constructor(container: InjectedDependencies, options: CashfreeOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
  }

  // ---------------------------------------------------------------------------
  // Cashfree HTTP helpers
  // ---------------------------------------------------------------------------

  protected get baseUrl(): string {
    return (
      this.options_.apiBaseUrl ?? BASE_URLS[this.options_.environment ?? "sandbox"]
    )
  }

  protected async request<T>(
    path: string,
    init: { method?: string; body?: unknown; idempotencyKey?: string } = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json",
      "x-client-id": this.options_.clientId,
      "x-client-secret": this.options_.clientSecret,
      "x-api-version": this.options_.apiVersion ?? "2025-01-01",
    }

    if (init.idempotencyKey) {
      headers["x-idempotency-key"] = init.idempotencyKey
    }

    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: init.method ?? "GET",
        headers,
        body: init.body ? JSON.stringify(init.body) : undefined,
      })
    } catch (e) {
      this.logger_.error(`Cashfree: could not reach ${this.baseUrl}: ${e}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Online payment is unavailable right now. Please try again or choose Cash on Delivery."
      )
    }

    const text = await res.text()
    let json: Record<string, unknown> = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { message: text.slice(0, 200) }
    }

    if (!res.ok) {
      const message = json?.message ?? `HTTP ${res.status}`
      this.logger_.error(`Cashfree ${init.method ?? "GET"} ${path} failed: ${message}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Cashfree: ${message}`
      )
    }

    return json as T
  }

  protected toNumber(amount: unknown): number {
    const value = Number(new BigNumber(amount as number).numeric)
    // Cashfree accepts at most two decimal places.
    return Math.round(value * 100) / 100
  }

  /** Cashfree expects a 10-digit Indian mobile number. */
  protected normalisePhone(phone?: string | null): string | null {
    const digits = (phone ?? "").replace(/\D/g, "")
    if (digits.length < 10) {
      return null
    }
    return digits.slice(-10)
  }

  protected safeCustomerId(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50)
  }

  /**
   * Cashfree order ids must be unique. A Medusa session can be re-priced, so
   * each Cashfree order gets a suffix: "<session_id>-<suffix>".
   */
  protected buildOrderId(sessionId: string): string {
    return `${sessionId}-${Date.now().toString(36)}`.slice(0, 45)
  }

  protected sessionIdFromOrderId(orderId: string): string {
    const index = orderId.lastIndexOf("-")
    return index > 0 ? orderId.slice(0, index) : orderId
  }

  protected checkReturnUrl(url?: string): string | undefined {
    if (!url) {
      return undefined
    }
    const allowed = this.options_.storefrontUrl
    if (allowed && !url.startsWith(allowed.replace(/\/$/, ""))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree: return_url must point to the storefront."
      )
    }
    return url
  }

  protected mapStatus(status: CashfreeOrderStatus): PaymentSessionStatus {
    switch (status) {
      case "PAID":
        return PaymentSessionStatus.CAPTURED
      case "EXPIRED":
      case "TERMINATED":
      case "TERMINATION_REQUESTED":
        return PaymentSessionStatus.CANCELED
      case "ACTIVE":
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  protected async createCashfreeOrder(
    sessionId: string,
    amount: number,
    currency: string,
    customer: {
      phone: string
      email?: string
      name?: string
      id?: string
    },
    returnUrl?: string
  ): Promise<CashfreeSessionData> {
    const orderId = this.buildOrderId(sessionId)

    const body: Record<string, unknown> = {
      order_id: orderId,
      order_amount: amount,
      order_currency: currency.toUpperCase(),
      customer_details: {
        customer_id: this.safeCustomerId(
          customer.id ?? customer.email ?? customer.phone
        ),
        customer_phone: customer.phone,
        customer_email: customer.email,
        customer_name: customer.name,
      },
      order_note: "Janki Design online order",
      order_tags: { session_id: sessionId },
      order_meta: {} as Record<string, string>,
    }

    const meta = body.order_meta as Record<string, string>
    if (returnUrl) {
      meta.return_url = returnUrl
    }
    if (this.options_.backendUrl) {
      meta.notify_url = `${this.options_.backendUrl.replace(/\/$/, "")}/hooks/payment/cashfree_cashfree`
    }

    const order = await this.request<CashfreeOrder>("/orders", {
      method: "POST",
      body,
      idempotencyKey: orderId,
    })

    return {
      session_id: sessionId,
      order_id: order.order_id,
      cf_order_id: String(order.cf_order_id),
      payment_session_id: order.payment_session_id,
      order_amount: order.order_amount,
      order_currency: order.order_currency,
      order_status: order.order_status,
      customer_phone: customer.phone,
      customer_email: customer.email,
      customer_name: customer.name,
      return_url: returnUrl,
    }
  }

  protected async fetchOrder(orderId: string): Promise<CashfreeOrder> {
    return this.request<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`)
  }

  // ---------------------------------------------------------------------------
  // Medusa payment provider interface
  // ---------------------------------------------------------------------------

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const data = (input.data ?? {}) as CashfreeInitiateData
    const sessionId = data.session_id

    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree: missing payment session id."
      )
    }

    const customer = input.context?.customer
    const phone = this.normalisePhone(data.customer_phone ?? customer?.phone)

    if (!phone) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Please add a 10-digit mobile number to your address to pay with Cashfree."
      )
    }

    const name =
      data.customer_name ??
      [customer?.first_name, customer?.last_name].filter(Boolean).join(" ")

    const session = await this.createCashfreeOrder(
      sessionId,
      this.toNumber(input.amount),
      input.currency_code,
      {
        phone,
        email: data.customer_email ?? customer?.email,
        name: name || undefined,
        id: customer?.id,
      },
      this.checkReturnUrl(data.return_url)
    )

    return {
      id: session.order_id,
      status: PaymentSessionStatus.PENDING,
      data: session,
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = (input.data ?? {}) as Partial<CashfreeSessionData>
    const amount = this.toNumber(input.amount)

    if (
      current.order_id &&
      current.order_amount === amount &&
      current.order_currency?.toLowerCase() === input.currency_code.toLowerCase()
    ) {
      return { data: current, status: PaymentSessionStatus.PENDING }
    }

    // Cashfree orders have a fixed amount, so re-pricing means a new order.
    if (current.order_id) {
      await this.terminate(current.order_id)
    }

    const phone = this.normalisePhone(current.customer_phone)
    if (!phone || !current.session_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree: cannot update a payment without a phone number and session id."
      )
    }

    const session = await this.createCashfreeOrder(
      current.session_id,
      amount,
      input.currency_code,
      {
        phone,
        email: current.customer_email,
        name: current.customer_name,
      },
      current.return_url
    )

    return { data: session, status: PaymentSessionStatus.PENDING }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = (input.data ?? {}) as Partial<CashfreeSessionData>
    if (!data.order_id) {
      return { status: PaymentSessionStatus.ERROR, data }
    }

    const order = await this.fetchOrder(data.order_id)
    return {
      status: this.mapStatus(order.order_status),
      data: { ...data, order_status: order.order_status },
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // Cashfree settles successful payments automatically; nothing to do.
    return { data: input.data }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const data = (input.data ?? {}) as Partial<CashfreeSessionData>
    if (!data.order_id) {
      return { status: PaymentSessionStatus.PENDING, data }
    }
    const order = await this.fetchOrder(data.order_id)
    return {
      status: this.mapStatus(order.order_status),
      data: { ...data, order_status: order.order_status },
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const data = (input.data ?? {}) as Partial<CashfreeSessionData>
    if (!data.order_id) {
      return { data }
    }
    const order = await this.fetchOrder(data.order_id)
    return { data: { ...data, order_status: order.order_status } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as Partial<CashfreeSessionData>
    if (!data.order_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree: cannot refund a payment without an order id."
      )
    }

    const refundId = `rf-${Date.now().toString(36)}`
    const refund = await this.request<CashfreeRefund>(
      `/orders/${encodeURIComponent(data.order_id)}/refunds`,
      {
        method: "POST",
        body: {
          refund_amount: this.toNumber(input.amount),
          refund_id: refundId,
          refund_note: "Refund from Janki Design",
        },
        idempotencyKey: refundId,
      }
    )

    const refunds = Array.isArray((data as Record<string, unknown>).refunds)
      ? ((data as Record<string, unknown>).refunds as unknown[])
      : []

    return { data: { ...data, refunds: [...refunds, refund] } }
  }

  protected async terminate(orderId: string): Promise<void> {
    try {
      await this.request(`/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        body: { order_status: "TERMINATED" },
      })
    } catch (e) {
      // A paid or already expired order cannot be terminated. That is fine.
      this.logger_.warn(`Cashfree: could not terminate ${orderId}`)
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = (input.data ?? {}) as Partial<CashfreeSessionData>
    if (data.order_id) {
      await this.terminate(data.order_id)
    }
    return { data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------

  protected verifySignature(payload: ProviderWebhookPayload["payload"]): boolean {
    const headers = payload.headers as Record<string, string | undefined>
    const signature = headers["x-webhook-signature"]
    const timestamp = headers["x-webhook-timestamp"]

    if (!signature || !timestamp) {
      return false
    }

    const age = Math.abs(Date.now() - Number(timestamp))
    if (Number.isFinite(age) && age > WEBHOOK_TOLERANCE_MS) {
      return false
    }

    const raw =
      typeof payload.rawData === "string"
        ? payload.rawData
        : Buffer.from(payload.rawData as Buffer).toString("utf8")

    const expected = crypto
      .createHmac("sha256", this.options_.clientSecret)
      .update(timestamp + raw)
      .digest("base64")

    const a = Buffer.from(expected)
    const b = Buffer.from(signature)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    if (!this.verifySignature(payload)) {
      this.logger_.warn("Cashfree webhook rejected: invalid signature")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const body = payload.data as {
      type?: string
      data?: {
        order?: { order_id?: string; order_tags?: Record<string, string> | null }
        payment?: { payment_amount?: number }
      }
    }

    const orderId = body.data?.order?.order_id
    if (!orderId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const sessionId =
      body.data?.order?.order_tags?.session_id ??
      this.sessionIdFromOrderId(orderId)

    // Only act on orders created by this store.
    if (!sessionId.startsWith("payses_")) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const amount = body.data?.payment?.payment_amount ?? 0

    switch (body.type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        return {
          action: PaymentActions.SUCCESSFUL,
          data: { session_id: sessionId, amount },
        }
      case "PAYMENT_FAILED_WEBHOOK":
      case "PAYMENT_USER_DROPPED_WEBHOOK":
        return {
          action: PaymentActions.FAILED,
          data: { session_id: sessionId, amount },
        }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }
}

export default CashfreePaymentProviderService
