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
| `npm run seed:catalog` | Categories and products (idempotent) |
| `npm run seed:admin` | The first admin user |
| `npm run seed:images` | Uploads `scripts/seed-images/` to Storage and points the rows at them (idempotent). `-- --cleanup-test-images` removes leftover `perf-test/` files |

Type-check with `npx tsc --noEmit`.

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
