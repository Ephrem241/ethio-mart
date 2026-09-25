# Ethio Mart

A modern online marketplace for Ethiopia: browse and search a catalog, add to
cart, check out with cash on delivery, follow an order, and manage everything
from an admin area. English and Amharic throughout, prices in ETB.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
shadcn/ui · Framer Motion · Supabase (Postgres, Auth, Storage, Row Level
Security) · Zod · React Hook Form · Zustand.

> This is a newer Next.js than most documentation describes. Read the guides in
> `node_modules/next/dist/docs/` before changing framework-level code (see
> [AGENTS.md](AGENTS.md)).

## Getting started

```bash
npm install
cp .env.example .env        # then fill in the three Supabase values
```

1. **Create the database.** Apply the files in `supabase/migrations/` in order
   (Supabase CLI, or paste them into the SQL editor).
   `supabase/combined-migration.sql` is the same set as a single file.
2. **Seed it** (uses the service-role key, run once, from the repo root):

   ```bash
   npm run seed:catalog   # 8 categories and 32 products
   npm run seed:admin     # the first admin account (prints its password once)
   npm run seed:images    # real photos for those products and categories
   ```

3. **Run it:** `npm run dev` → http://localhost:3000

The service-role key is server-only. It must never be prefixed with
`NEXT_PUBLIC_` and never reach the browser.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build, serve the build |
| `npm run lint` | ESLint (also enforces React purity rules) |
| `npm run check:i18n` | Fails if any UI text is hard-coded instead of coming from the dictionaries |
| `npm test` | Unit tests (Vitest) — no network, a few seconds |
| `npm run test:e2e` | Browser tests (Playwright) against a running build — see [Testing](#testing) |
| `npm run seed:catalog` | Categories and products (idempotent) |
| `npm run seed:admin` | The first admin user |
| `npm run seed:images` | Uploads `scripts/seed-images/` to Storage and points the rows at them (idempotent). `-- --cleanup-test-images` removes leftover `perf-test/` files |

Type-check with `npx tsc --noEmit`.

## Testing

**Unit tests** (`npm test`, Vitest, `src/**/*.test.ts`) cover the logic that has
no screen: prices and cart maths, the cart/favorites sync merge, phone numbers,
slugs, redirect safety, translations (every English key has an Amharic one, same
placeholders, real Ethiopic script), database-error translation, listing URLs,
SEO metadata and structured data, and the form schemas. They need no network.

**Browser tests** (`npm run test:e2e`, Playwright, `e2e/`) drive the real site
in Chrome:

| File | What it proves |
| --- | --- |
| `flow-1-guest` | Home → search → product → add to cart → cart (desktop and phone) |
| `flow-2-customer` | Register → browse → cart → checkout → order placed → order page; free delivery over the threshold; today's price is charged |
| `flow-3-returning` | Log in → account → orders → order details |
| `flow-4-admin` | Log in → create a product → edit it → open an order → change its status |
| `flow-5-language` | English → Amharic → English while browsing; `?lang=` links; Amharic page titles and alternate links; a bad language value falls back to English (desktop and phone) |
| `errors` | The ten error states: no internet, bad login, bad checkout, empty cart, out of stock, invalid product/category, unauthorized admin access, database failure, image failure — each with a useful screen |
| `quality-audit` | Every route at 1280, 768 and 390 px: status, one `<h1>`, title, SEO tags (or `noindex` on private pages), no console errors, failed requests, broken images or sideways scrolling, and zero accessibility violations (axe, WCAG 2.2 AA); plus an internal-link crawl and the sitemap |

To run them:

```bash
npm run build
npm run test:e2e              # or: npx playwright test flow-2 --project=desktop
```

Playwright starts `npm run start` itself when nothing is listening on port 3000
(so build first), and reuses a server that is already running.
`E2E_BASE_URL` points the suite at another server instead, and
`E2E_BROWSER_CHANNEL` picks the browser (default: the installed Google Chrome).
Results and traces land in `playwright-report/` and `test-results/`
(git-ignored).

**These tests use the real Supabase project in `.env`, and need the
service-role key there** — only to create and remove their own data, never in
the app. What that means in practice:

- Accounts are `e2e-*@example.com`, products have slugs starting `e2e-`. Nothing
  else is ever deleted — the setup and teardown refuse any other address.
- Before a run the catalog is snapshotted; after it, any price, stock or
  visibility the tests changed is put back and every test account, order, cart,
  address and favorite is removed. A crashed run is cleaned up by the next one.
- Don't run them against a production database with real orders in flight.

Not covered: a complete server-side database outage can't be simulated (the
public Supabase address is fixed into the build), so "database failure" is
tested from the browser side; and nothing here replaces a pass with a real
screen reader.

## What an admin controls

- **Products, categories, orders, customers** — Admin → the matching page.
- **Homepage copy** — Admin → Homepage: the hero and the "Special Deals"
  banner, each in English and Amharic. In the deals headline or subtext, write
  `{maxDiscount}` and the storefront replaces it with the biggest discount
  among products actually on sale ("Up to 23% Off"). The banner disappears
  while nothing is on sale.
- **Deals countdown** — Admin → Homepage → "Offer ends". While that moment is
  in the future the banner shows a live countdown; leave it empty for none. A
  countdown is never invented.
- **Free delivery** — the `store_settings` row `free_delivery_threshold` (ETB).
  Orders whose subtotal is strictly above it ship free; the database applies it
  when it prices the order. The announcement bar, cart hint and product page
  mention the offer only while that row exists — delete it to switch the offer
  off everywhere.
- **Delivery fees** — one row per city in `delivery_fees` (`Other` is the
  fallback). There is no admin screen for these yet; edit them in the Supabase
  dashboard. The Delivery page lists them.
- **Contact details and return window** — the footer pages (Contact, Delivery,
  Returns, FAQ, About, Privacy, Terms) show only what the shop has set. Add
  these `store_settings` rows (key → JSON value) in the Supabase dashboard:
  `contact_email`, `contact_phone`, `contact_address`, `support_hours` (text)
  and `return_window_days` (a whole number of days, 1–365). Until they exist the
  Contact page says the details are coming and the Returns page states no time
  limit — nothing is invented. There is no admin screen for these yet.
- **Privacy policy and terms** — plain-language drafts that describe what the
  store actually does (cash on delivery, the data it keeps, the cookies it
  sets). Have the owner, ideally with a lawyer, review both — and the Amharic
  wording — before launch. Bump `LEGAL_LAST_UPDATED` in
  `src/components/info/info-page.tsx` whenever they change.

## How it is put together

- `src/app` — routes. `src/components` — UI by area (`home`, `product`,
  `catalog`, `cart`, `checkout`, `account`, `admin`, …).
  `src/lib/services` — every data access; components never query Supabase
  directly.
- **Design system** — tokens (forest green, ivory, cream, sand, gold) live in
  `src/app/globals.css`. Headings use `font-display`. The three typefaces are
  self-hosted in `src/app/fonts`, so nothing needs the network to build.
- **Images** — the homepage photography is in `public/images/home/`; product
  and category photos are in Supabase Storage. Photo sources and licences:
  `scripts/seed-images/CREDITS.md`.
- **Languages** — `src/locales/en` is the source of truth and `src/locales/am`
  must provide every key (a missing translation is a compile error). The
  Amharic wording is a first draft: have a native speaker review it.
- **Security** — Row Level Security everywhere; the order, its prices, delivery
  fee and payment status are decided inside the database (`place_order`), never
  by the browser. `/admin` is authorized on the server.

## Deploying

Set the same environment variables on your host (Vercel works out of the box)
and set `NEXT_PUBLIC_SITE_URL` to the public address so canonical links, the
sitemap and share images are correct.
