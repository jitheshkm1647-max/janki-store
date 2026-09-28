import crypto from "crypto"
import CashfreePaymentProviderService from "../service"

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any

const options = {
  clientId: "TEST_ID",
  clientSecret: "TEST_SECRET",
  environment: "sandbox" as const,
  storefrontUrl: "http://localhost:8000",
  backendUrl: "http://localhost:9000",
}

function mockFetch(response: unknown, ok = true) {
  const fn = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    text: async () => JSON.stringify(response),
  })
  global.fetch = fn as any
  return fn
}

describe("CashfreePaymentProviderService", () => {
  let service: CashfreePaymentProviderService

  beforeEach(() => {
    service = new CashfreePaymentProviderService({ logger }, options)
  })

  it("requires keys", () => {
    expect(() =>
      CashfreePaymentProviderService.validateOptions({ clientId: "x" })
    ).toThrow(/clientSecret/)
  })

  it("creates a Cashfree order when a session starts", async () => {
    const fetchFn = mockFetch({
      cf_order_id: 123,
      order_id: "payses_01ABC-xyz",
      order_amount: 3799,
      order_currency: "INR",
      order_status: "ACTIVE",
      payment_session_id: "session_abc",
    })

    const result = await service.initiatePayment({
      amount: 3799,
      currency_code: "inr",
      data: {
        session_id: "payses_01ABC",
        customer_phone: "+91 98470 12345",
        customer_email: "anu@example.com",
        customer_name: "Anu Menon",
        return_url: "http://localhost:8000/api/cashfree-return?cart_id=cart_1",
      },
    })

    expect(result.data?.payment_session_id).toBe("session_abc")
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe("https://sandbox.cashfree.com/pg/orders")
    const body = JSON.parse(init.body)
    expect(body.order_amount).toBe(3799)
    expect(body.order_currency).toBe("INR")
    expect(body.customer_details.customer_phone).toBe("9847012345")
    expect(body.order_id.startsWith("payses_01ABC-")).toBe(true)
    expect(body.order_tags.session_id).toBe("payses_01ABC")
    expect(body.order_meta.notify_url).toBe(
      "http://localhost:9000/hooks/payment/cashfree_cashfree"
    )
    expect(init.headers["x-client-id"]).toBe("TEST_ID")
  })

  it("rejects a session without a phone number", async () => {
    mockFetch({})
    await expect(
      service.initiatePayment({
        amount: 100,
        currency_code: "inr",
        data: { session_id: "payses_1" },
      })
    ).rejects.toThrow(/mobile number/)
  })

  it("rejects return URLs outside the storefront", async () => {
    mockFetch({})
    await expect(
      service.initiatePayment({
        amount: 100,
        currency_code: "inr",
        data: {
          session_id: "payses_1",
          customer_phone: "9847012345",
          return_url: "https://evil.example.com/steal",
        },
      })
    ).rejects.toThrow(/return_url/)
  })

  it("maps PAID to captured and ACTIVE to pending", async () => {
    mockFetch({ order_id: "o1", order_status: "PAID" })
    const paid = await service.authorizePayment({ data: { order_id: "o1" } })
    expect(paid.status).toBe("captured")

    mockFetch({ order_id: "o1", order_status: "ACTIVE" })
    const pending = await service.authorizePayment({ data: { order_id: "o1" } })
    expect(pending.status).toBe("pending")
  })

  it("shows a friendly message when Cashfree is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("ENOTFOUND")) as any
    await expect(
      service.authorizePayment({ data: { order_id: "o1" } })
    ).rejects.toThrow(/Cash on Delivery/)
  })

  it("accepts a correctly signed success webhook", async () => {
    const raw = JSON.stringify({
      type: "PAYMENT_SUCCESS_WEBHOOK",
      data: {
        order: { order_id: "payses_01ABC-xyz", order_tags: null },
        payment: { payment_amount: 3799 },
      },
    })
    const ts = String(Date.now())
    const sig = crypto
      .createHmac("sha256", "TEST_SECRET")
      .update(ts + raw)
      .digest("base64")

    const result = await service.getWebhookActionAndData({
      data: JSON.parse(raw),
      rawData: Buffer.from(raw),
      headers: { "x-webhook-signature": sig, "x-webhook-timestamp": ts },
    })

    expect(result.action).toBe("captured")
    expect(result.data?.session_id).toBe("payses_01ABC")
    expect(result.data?.amount).toBe(3799)
  })

  it("ignores a webhook with a bad signature", async () => {
    const raw = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: {} })
    const result = await service.getWebhookActionAndData({
      data: JSON.parse(raw),
      rawData: Buffer.from(raw),
      headers: {
        "x-webhook-signature": "nope",
        "x-webhook-timestamp": String(Date.now()),
      },
    })
    expect(result.action).toBe("not_supported")
  })
})
