# Janki Design online store

The e-commerce platform for **Janki Design**, a boutique and custom stitching studio in Kochi. Built by Brandbyte Solutions on:

```
Next.js storefront  (apps/storefront, port 8000)
        │
        ▼
Medusa v2 API + Admin  (apps/backend, port 9000, admin at /app)
        ├── PostgreSQL   catalogue, inventory, orders, customers, promotions
        ├── Redis        events, workflows, locking
        ├── Stitching    measurement profiles + studio appointments (custom module)
        └── Payments     Cashfree (UPI, cards, netbanking) + Cash on Delivery
```

See [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) for the architecture, data model and the roadmap (AI stylist, loyalty, membership, marketplace).

---

## What is already built

**Shop**
- India region: INR prices that include GST (shown like an MRP), GST 5% default tax rate
- Categories: Bridal, Kurtis & Dresses, Co-ord Sets, Festive & Onam, Kids, Custom Stitching
- Delivery options: Standard (India) ₹99, Express (Kerala) ₹199, Collect from studio (free)
- Welcome offer code `WELCOME10` (10% off)
- 9 sample ready-to-wear products and 6 stitching services with sample prices and placeholder images

**Custom stitching**
- Stitching services are sold as products (for example Blouse Stitching: Simple / Lined / Princess cut / Designer / Bridal Aari)
- On the product page the customer chooses how we get their measurements: a saved profile, a studio visit, or a sample garment. They can add design notes, a reference link and a "needed by" date
- These details are saved on the order line item and appear as a **job card** on the order in the admin
- Customers can save several **measurement profiles** (Me, Amma, Daughter) in their account; staff see them on the customer page in the admin

**Appointments**
- `/book-appointment` and `/bridal`: bridal consultations, measurement visits, trial fittings, alterations, video calls
- New **Appointments** page in the admin to confirm, complete or cancel requests

**Payments**
- **Cashfree**: UPI (GPay, PhonePe, Paytm), cards, netbanking, wallets. Order is created only when Cashfree reports the payment as PAID; webhooks complete the order even if the customer closes the tab
- **Cash on Delivery**: order is placed as "authorized"; press *Capture payment* in the admin when the cash is collected

**Brand**
- Janki wine, gold and ivory palette, Marcellus + Figtree fonts (self-hosted), logo, favicon and share images
- Pages: Home, Shop, Category, Product, Bridal, Custom Stitching, Book a Visit, Cart, Checkout, Account (orders, addresses, measurements)

---

## Run it on your Mac

**You need:** Node.js 20.19+ or 22.12+ (`node -v`), and Docker Desktop (for PostgreSQL and Redis). If you already run PostgreSQL 15+ and Redis locally, you can skip Docker and change `DATABASE_URL` / `REDIS_URL` in `apps/backend/.env`.

```bash
cd janki-store

# 1. Install everything (backend workspace + storefront)
npm run setup

# 2. Start PostgreSQL and Redis
npm run db:up

# 3. Create the tables and load the Janki starter data (runs once)
npm run db:migrate

# 4. Connect the storefront to the backend (writes apps/storefront/.env.local)
npm run storefront:key

# 5. Create your admin login (change the password after first login)
npm run admin:create

# 6. Start backend + storefront together
npm run dev
```

- Storefront: http://localhost:8000
- Admin: http://localhost:9000/app (admin@jankidesign.com / ChangeMe123!)

### Turning on Cashfree

1. In the Cashfree merchant dashboard, copy your **App ID** and **Secret Key** (use Test keys first).
2. Put them in `apps/backend/.env`:
   ```
   CASHFREE_CLIENT_ID=...
   CASHFREE_CLIENT_SECRET=...
   CASHFREE_ENVIRONMENT=sandbox
   ```
3. In the admin, go to **Settings → Regions → India → Payment providers** and tick `cashfree`. (If the keys were already set before step 3 of the setup, this is done for you.)
4. Keep `NEXT_PUBLIC_CASHFREE_MODE=sandbox` in `apps/storefront/.env.local` while testing.
5. In Cashfree, add a webhook pointing to `https://<your-backend-domain>/hooks/payment/cashfree_cashfree` (payment success, failed and user dropped events). Set `MEDUSA_BACKEND_URL` so every order also carries this address.
6. Cashfree requires HTTPS return URLs in production, so go live only on your real domain. Switch both settings to `production` with your live keys.

---

## Deploy to the Hostinger VPS

The production stack runs in Docker on one VPS: PostgreSQL, Redis, Medusa, the Next.js storefront and Caddy (automatic HTTPS).

| Address | Serves |
|---|---|
| `https://jankidesign.com` | Storefront (`www.` redirects here) |
| `https://api.jankidesign.com` | Medusa API; admin at `/app` |

1. **DNS** (hPanel → Domains → jankidesign.com → DNS): point `@`, `www` and `api` A records to the VPS IP.
2. **On the VPS** (hPanel → VPS → Browser terminal, as root):
   ```bash
   git clone <repo-url> /opt/janki-store
   cd /opt/janki-store
   bash deploy/setup-vps.sh jankidesign.com your-email@example.com
   ```
   The script installs Docker, generates secrets in `deploy/.env.production`, builds everything, and prints the admin login once. Save it.
3. **Updates:** `cd /opt/janki-store && git pull && bash deploy/setup-vps.sh jankidesign.com`
4. **Cashfree:** `cd /opt/janki-store && git pull && bash deploy/set-cashfree.sh`. It asks for the App ID and Secret Key (test or live), checks them with Cashfree, restarts the store and adds Cashfree to checkout. Run it again to switch to live keys.
5. **Logs:** `docker compose -f docker-compose.prod.yml --env-file deploy/.env.production logs -f backend storefront`

Recommended: KVM 2 (8 GB) or larger. On KVM 1 the script adds swap so builds finish.

---

## Replace the sample content

Everything in the starter catalogue is a placeholder. Before launch, in the admin:

- **Products:** replace names, descriptions, prices, stock and photos with the real catalogue. Delete what you do not sell. Products marked `sample: true` in their metadata came from the starter.
- **Stitching prices** and turnaround days (`turnaround_days` in product metadata)
- **GST:** 5% is the default. Apparel GST depends on the sale value, so confirm the right rates with your accountant and add tax rules in *Settings → Tax Regions*
- **Delivery prices** in *Settings → Locations & Shipping*
- **Studio address, hours and phone** in `apps/storefront/src/lib/brand.ts`
- **Policy wording** at checkout (`apps/storefront/src/modules/checkout/components/review/index.tsx`) and the product *Shipping & Returns* tab

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Backend and storefront together |
| `npm run backend:dev` / `npm run storefront:dev` | One app only |
| `npm run build` | Production build of both apps |
| `npm run db:up` / `npm run db:down` | Start / stop PostgreSQL and Redis |
| `npm run db:migrate` | Apply database migrations |
| `npm run storefront:key` | Copy the publishable API key into the storefront env |
| `cd apps/backend && npm run test:unit` | Cashfree provider tests |

## Project layout

```
apps/backend/
  medusa-config.ts                 modules, Redis, Cashfree, S3
  src/modules/cashfree/            Cashfree payment provider (+ unit tests)
  src/modules/stitching/           measurement profiles + appointments
  src/workflows/                   create/update appointment, measurement workflows
  src/api/store/appointments       public booking API
  src/api/store/customers/me/measurements   customer measurement API
  src/api/admin/appointments       admin API
  src/admin/                       Appointments page, measurement + job card widgets
  src/subscribers/                 order.placed and appointment.created hooks
  src/migration-scripts/initial-data-seed.ts   Janki starter data
  static/catalogue/                placeholder product images
apps/storefront/                   Next.js 15 storefront (standalone npm project)
  src/lib/brand.ts                 business details
  src/lib/data/stitching.ts        appointment + measurement server actions
  src/modules/stitching/           booking form, measurement manager
  src/app/api/cashfree-return      completes the order after Cashfree checkout
docs/BLUEPRINT.md                  architecture and roadmap
```

The storefront has its own `package-lock.json` and is intentionally outside the npm workspace. The Medusa admin needs React 18 while Next.js 15 uses React 19; keeping them apart avoids a production build error.
