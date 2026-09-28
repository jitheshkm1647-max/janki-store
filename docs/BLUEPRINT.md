# Janki Design commerce platform: technical blueprint

Prepared by Brandbyte Solutions for Janki Design, Kochi. Version 1, September 2026.

This document explains how the Janki Design store is built, what the first release contains, and how each future feature (AI stylist, recommendations, loyalty, membership, personalised feed, subscriptions, multiple brands, marketplace) fits onto the same foundation.

---

## 1. Goals

1. **Sell online beyond the studio.** Ready-to-wear and festive collections to customers across India, paid by UPI, card, netbanking or cash on delivery.
2. **Take custom stitching and bridal work online.** Customers order a stitching service, share measurements once, and book consultations and fittings without a phone call.
3. **Own the platform.** No per-order platform fee and no feature ceiling, so Janki can add loyalty, membership, AI styling or a marketplace later without migrating.
4. **Stay easy to run.** Studio staff work from one admin: orders, stock, appointments, customer measurements.

## 2. Architecture

```
                 Customers (mobile first)                 Studio staff
                          │                                    │
                          ▼                                    ▼
          ┌──────────────────────────────┐      ┌──────────────────────────┐
          │  Next.js 15 storefront        │      │  Medusa Admin (/app)      │
          │  apps/storefront              │      │  + Janki extensions       │
          │  SSR/ISR pages, server actions│      │  Appointments, job cards, │
          └───────────────┬──────────────┘      │  measurements             │
                          │ Store API            └────────────┬─────────────┘
                          ▼  (publishable key)                │ Admin API
          ┌───────────────────────────────────────────────────▼─────────────┐
          │                    Medusa v2 application  (apps/backend)        │
          │  Commerce modules: Product · Pricing · Inventory · Stock        │
          │  location · Cart · Order · Customer · Promotion · Tax ·         │
          │  Fulfillment · Payment · Region · Sales channel · Search        │
          │  Custom modules:   Stitching (measurements, appointments)       │
          │                    Cashfree payment provider                    │
          │  Workflows · Subscribers · Scheduled jobs · Module links        │
          └──────┬───────────────┬──────────────────┬──────────────┬────────┘
                 ▼               ▼                  ▼              ▼
            PostgreSQL         Redis            Cashfree PG     File storage
            (all data)   (events, workflow    (UPI, cards,     (local disk →
                          engine, locks)       netbanking,      S3 / R2 in
                                               webhooks)        production)
```

### Why Medusa + Next.js

| Need | How this stack answers it |
|---|---|
| Custom stitching, measurements, appointments | Custom Medusa **modules** with their own tables, linked to customers and orders |
| AI stylist, recommendations, personalised feed | Own **API routes** and **workflows** with full access to catalogue, orders and customer data |
| Loyalty, membership, subscriptions | New modules + **promotions** engine + **subscribers** on order events |
| Multiple brands | **Sales channels**, **stores** and publishable keys per brand |
| Marketplace | Vendor module linked to products and orders, with Cashfree split payouts |
| Indian payments | Custom **Cashfree provider** (built) and Medusa's manual provider for COD |
| No lock-in | Open source (MIT); data in our own PostgreSQL |

### Hosting (recommended for launch)

| Part | Option | Notes |
|---|---|---|
| Storefront | Vercel, or a Node server | Mumbai region edge. Needs `NEXT_PUBLIC_*` env vars |
| Backend | Railway, Render, DigitalOcean (Bangalore) or AWS Mumbai | Run one `server` and one `worker` instance (`MEDUSA_WORKER_MODE`) |
| PostgreSQL | Managed Postgres 15+ in India region | Daily backups, point-in-time recovery |
| Redis | Managed Redis | Required in production (events, workflows, locks) |
| Images | Cloudflare R2 or AWS S3 | Set `S3_*` env vars; the file module switches automatically |
| Domain | `jankidesign.com` (store), `api.jankidesign.com` (backend) | HTTPS is mandatory for Cashfree production |

## 3. Release 1 (built)

| Area | What is included |
|---|---|
| Region & tax | India, INR, prices include GST, default GST 5% |
| Catalogue | 6 categories, 3 collections, sample ready-to-wear products and stitching services |
| Custom stitching | Stitching services as products; measurement mode, design notes, reference link and needed-by date saved per line item; admin job-card widget |
| Measurements | Customers keep several profiles in their account; admin sees them on the customer page |
| Appointments | Booking form (bridal consultation, custom stitching, measurement, trial fitting, alteration, video call); admin Appointments page with status changes |
| Payments | Cashfree (UPI/cards/netbanking/wallets) with webhook handling; Cash on Delivery |
| Delivery | Standard India, Express Kerala, free studio pickup |
| Promotions | `WELCOME10` sample code; full Medusa promotions engine available |
| Storefront | Janki-branded Home, Shop, Category, Product, Bridal, Custom Stitching, Book a Visit, Cart, Checkout, Account |
| Quality | Cashfree provider unit tests; end-to-end tested flows: booking, stitching order, COD order, and Cashfree paid and unpaid returns (against a mock Cashfree server, since live Cashfree keys were not available) |

## 4. Data model

### 4.1 Medusa modules used as-is

- **Product**: products, variants (size / stitching style), options, categories, collections, images, `metadata`
- **Pricing**: INR prices per variant, tax-inclusive price preference
- **Inventory / Stock location**: one location, "Janki Design Studio, Ernakulam"; services have `manage_inventory = false`
- **Cart / Order**: line item `metadata` carries custom stitching details (below)
- **Customer**: accounts, addresses, groups (used later for membership tiers)
- **Promotion**: codes, automatic discounts, buy-X-get-Y, campaigns with budgets
- **Payment**: `pp_cashfree_cashfree`, `pp_system_default` (COD)
- **Fulfillment**: manual provider with three shipping options

### 4.2 Custom module: `stitching`

`measurement_profile`

| Field | Type | Notes |
|---|---|---|
| id | `meas_…` | |
| customer_id | text, indexed | read-only link to Customer |
| name | text | "Me", "Amma" |
| unit | `in` \| `cm` | |
| measurements | json | keys: bust, under_bust, waist, hip, shoulder, armhole, sleeve_length, sleeve_round, blouse_length, front_neck_depth, back_neck_depth, top_length, bottom_waist, bottom_length, thigh, ankle |
| notes | text | fit preferences |

`appointment`

| Field | Type | Notes |
|---|---|---|
| id | `appt_…` | |
| type | enum | bridal_consultation, custom_stitching, measurement, trial_fitting, alteration, video_consultation |
| status | enum | requested → confirmed → completed / cancelled / no_show |
| name, phone, email | text | phone required |
| customer_id | text, nullable | set when a logged-in customer books |
| preferred_date, preferred_slot | datetime, enum | morning / afternoon / evening |
| event_date, budget_range | nullable | bridal only |
| notes, staff_notes | text | |

### 4.3 Custom stitching line item metadata

```json
{
  "stitching": true,
  "measurement_mode": "saved_profile | studio_visit | sample_garment",
  "measurement_profile_id": "meas_…",
  "measurement_profile_name": "Amma",
  "measurement_unit": "cm",
  "measurements": { "bust": 92, "waist": 80 },
  "design_notes": "Boat neck, elbow sleeves",
  "reference_link": "https://instagram.com/…",
  "needed_by": "2026-11-02"
}
```

Measurements are **copied** into the order, so later edits to a profile never change an order already in the workshop.

## 5. Key flows

**Custom stitching order**
1. Customer opens a stitching service, picks a style, chooses a measurement mode and adds notes.
2. Server action validates the profile belongs to the customer and adds the line item with metadata.
3. Checkout as normal. `order.placed` subscriber logs the order (next: WhatsApp + job card).
4. Staff see the job card on the order page in the admin.

**Cashfree payment**
1. At the payment step the storefront starts a session with phone, email, name and a return URL.
2. Backend creates a Cashfree order (`order_id = <payment session id>-<suffix>`, tagged with the session id) and returns `payment_session_id`.
3. Storefront opens Cashfree Checkout. Customer pays.
4. Cashfree redirects to `/api/cashfree-return`. The storefront completes the cart; Medusa asks Cashfree for the order status. `PAID` → order is created and marked captured. Anything else → customer returns to checkout with a message.
5. Independently, Cashfree's signed webhook (`/hooks/payment/cashfree_cashfree`) completes the order if the customer never returns. Signatures are verified with HMAC-SHA256 and a 10-minute replay window.

**Cash on Delivery**: order is placed with payment "authorized". When cash or UPI is collected at the door or studio, staff press *Capture payment*.

**Appointment**: public API validates input → workflow creates the record and emits `appointment.created` → subscriber (next: notify studio on WhatsApp) → staff confirm in the admin.

## 6. Roadmap

Each phase builds on Medusa primitives: a **module** for new data, **links** to connect it to customers, products or orders, **workflows** for business logic with rollback, **subscribers** for events, **API routes** for the storefront and **admin widgets** for staff.

### Phase 2: Launch readiness (4–6 weeks)

| Item | Approach |
|---|---|
| Real catalogue & photography | Admin import (CSV) or product API; photos to R2/S3 |
| WhatsApp & email notifications | Notification module provider for WhatsApp Cloud API (Meta) and an email provider (SendGrid, Resend); templates for order placed, shipped, appointment confirmed, stitching ready |
| GST invoices | Workflow on `order.placed` that renders a PDF invoice with GSTIN, HSN codes and tax breakup; attach to the order |
| Courier integration | Fulfillment module provider for a courier aggregator (for example Shiprocket): rates, labels, tracking |
| SEO & analytics | Product/Organisation structured data, sitemap (already generated), GA4, Meta Pixel with Conversions API, Google Merchant Center feed |
| Legal pages | Terms, privacy, shipping, returns and alteration policy |
| Hardening | Production secrets, rate limiting on booking endpoint, error tracking (Sentry), uptime monitoring, database backups |

### Phase 3: Customer growth

**Loyalty ("Janki Rewards")**
- Module `loyalty` with `loyalty_account` (customer_id, points_balance, tier) and `loyalty_transaction` (type earn/redeem/expire, points, order_id).
- Subscriber on `order.placed` earns points once payment is captured; on refund, reverse them.
- Redemption: a workflow converts points into a single-use Promotion code applied to the cart.
- Scheduled job expires points after 12 months. Admin widget shows balance on the customer page.

**Membership ("Janki Circle")**
- Customer groups for tiers (Silver/Gold/Bridal Circle); price lists give members-only prices.
- Module `membership` (customer_id, plan, starts_at, renews_at, status).
- Paid plans billed through Cashfree Subscriptions; webhooks update membership status.
- Perks as automatic promotions targeted at the member group: free alterations, early access to collections, priority bridal slots.

**Subscriptions / custom models**
- Examples: "Blouse of the month", seasonal stitching credit packs, alteration packs.
- Module `subscription` (customer, plan, interval, next_run_at, cart template). A scheduled job creates an order each cycle via the draft-order and payment workflows.

**Personalised fashion feed**
- Track product views, wishlists and purchases (`customer_event` module or an analytics store).
- Feed endpoint `/store/feed` ranks products by recent behaviour, body measurements (fit-friendly styles), occasions (upcoming wedding date from appointments) and season (Onam, Vishu, wedding season).

**Reviews & UGC**: module `review` linked to product and order; only verified buyers can review; admin moderation.

### Phase 4: AI features

**AI stylist**
- Chat widget on the storefront calling `/store/stylist`.
- The backend route calls an LLM with tools: search the catalogue (Medusa search/index module), read the customer's saved measurements and past orders (with consent), check stock and price, and add to cart.
- Grounded answers only: products and prices always come from Medusa, never from the model's memory.
- Use cases: "What should I wear to a Christian wedding reception in December?", "Suggest a blouse design for this kasavu saree", "Which size fits me?" (uses the measurement profile).
- Log conversations (anonymised) to improve prompts; hand off to a human on WhatsApp for bridal enquiries.

**AI product recommendations**
- Start with "bought together" from order history (SQL over order line items, refreshed nightly by a scheduled job).
- Add embeddings for product text and images (pgvector in PostgreSQL) for "similar styles".
- Blend with the personalised feed signals. Serve through `/store/recommendations?product_id=…`.

**Studio productivity**: AI summary of consultation notes into a job card; photo-to-measurement estimates only as a suggestion, always confirmed by a tailor.

### Phase 5: Multiple brands and marketplace

**Multiple brands** (for example a separate kids or men's label)
- One Medusa backend, one sales channel and publishable key per brand, separate storefronts (or one storefront with brand themes).
- Shared customers and inventory where useful; separate price lists and promotions per brand.

**Marketplace** (partner designers and weavers selling through Janki)
- Module `vendor` (name, GSTIN, bank details reference, commission rate, status) and `vendor_admin` users.
- Links: vendor ↔ product, vendor ↔ order line item.
- Order-splitting workflow creates per-vendor fulfilments; vendor dashboard via admin routes filtered by vendor.
- Payouts through Cashfree's split settlement (Easy Split) with commission retained by Janki.
- KYC, returns responsibility and TCS/TDS obligations to be confirmed with Janki's CA before launch.

## 7. Security, privacy and compliance

- **Personal data:** measurements, phone numbers and addresses are personal data under India's Digital Personal Data Protection Act, 2023. Collect with clear consent, let customers edit and delete profiles (built), and add a data-deletion request process.
- **Payments:** card and UPI data never touch our servers; Cashfree hosts the checkout. Webhooks are signature-verified.
- **Access:** admin users per staff member; remove access when staff leave. Use strong `JWT_SECRET` and `COOKIE_SECRET`.
- **Backups:** daily database backups with a tested restore.
- **Tax:** GST rates and invoice format to be confirmed by Janki's accountant.

## 8. Go-live checklist

- [ ] Real products, prices, stock and photos loaded; sample products deleted
- [ ] GST rates confirmed; invoice template approved
- [ ] Delivery prices and courier confirmed
- [ ] Cashfree live keys, webhook URL, HTTPS domain; test ₹1 live payment and refund
- [ ] Studio details in `brand.ts`; policies published
- [ ] Notifications (WhatsApp/email) working for orders and appointments
- [ ] Admin accounts for each staff member; default admin password changed
- [ ] Analytics, Search Console, Merchant Center connected
- [ ] Backups, monitoring and error tracking on

## 9. Decisions needed from Janki Design

1. Final price list for stitching services and turnaround times
2. Whether customers can pay a **deposit** for bridal orders (can be built as a partial payment / draft order flow)
3. Delivery coverage and charges (all India, free-delivery threshold)
4. Alteration and return policy wording
5. Which roadmap items matter most after launch (suggested order: notifications → loyalty → AI stylist)
