# Evael Store

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
| `npm run check:secrets` | Fails if a Supabase secret key is in the built site or committed to git — see [Going live](#going-live) |
| `npm run smoke -- <address>` | Read-only health check of a running site (safe on the live shop) |
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
| `cart-sync` | An item added just before a reload is not lost when the server missed the save (the cart re-sends it) |
| `admin-homepage` | The hero headline is a multi-line field, so the line break the storefront shows can be seen and kept |
| `security-headers` | Every response carries the security headers and the Content-Security-Policy; the design-system page is a 404 in production (run against a production build) |
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

## Going live

The site is built for Vercel + Supabase. Do these in order; each step says where.

### 1. Supabase project

1. **Database.** Apply `supabase/migrations/0001` … `0017` in order (or
   `supabase/combined-migration.sql`, which is all of them). `0017` is the
   production hardening from the advisors' report (see [Security](#security)).
2. **Seed** (from your computer, uses the service-role key): `npm run seed:catalog`,
   `npm run seed:admin` (prints the admin password once — **log in and change
   it**), `npm run seed:images`.
3. **Shop details.** In `store_settings` set `contact_email`, `contact_phone`,
   `contact_address`, `support_hours`, `return_window_days`, and check
   `free_delivery_threshold` and the `delivery_fees` rows
   (see [What an admin controls](#what-an-admin-controls)). Until they are set the
   Contact and Returns pages say the details are coming — nothing is invented.
4. **Dashboard settings** (SQL cannot do these):
   - *Authentication → URL Configuration*: **Site URL** = the public address
     (`https://www.your-shop.com`). **Redirect URLs** (the allow-list): add
     `https://www.your-shop.com/**` and, for local work, `http://localhost:3000/**`.
     The app sends people through `/auth/callback` (Google sign-in and password
     reset); an address that is not on the list is refused. Preview deployments
     need their own entry (`https://*-<your-team>.vercel.app/**`) if you test
     sign-in there.
   - *Authentication → Providers → Google*: the OAuth client's redirect URI is
     `https://<project>.supabase.co/auth/v1/callback`.
   - *Authentication → Emails → SMTP Settings*: send through Resend, like
     the store's own emails. See [5. Email](#5-email-resend), step 5.
     Supabase's built-in mailer allows only a few e-mails an hour, so password
     resets stop working under real traffic without it.
   - *Authentication → Passwords*: turn on "Prevent use of leaked passwords"
     (a Pro-plan feature) and pick a minimum length.
   - *Database → Backups*: daily backups (or point-in-time recovery) before
     real orders arrive. The free plan has neither.

### 2. Hosting (Vercel)

Import the repository (Next.js preset, Node 20.9 or newer — see `engines`).
Add these environment variables to **Production and Preview**:

| Variable | | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | required | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required | the **anon / publishable** key — never the service-role/secret key |
| `NEXT_PUBLIC_SITE_URL` | recommended | the public address, e.g. `https://www.your-shop.com`, no trailing slash (canonical links, sitemap, share previews). If unset, Vercel's production domain is used |
| `RESEND_API_KEY`, `EMAIL_FROM`, `SHOP_NOTIFY_EMAIL`, `EMAIL_DISPATCH_SECRET` | recommended | the store's emails — see [5. Email](#5-email-resend). Without them the shop works, but no email is sent |
| `SUPABASE_SERVICE_ROLE_KEY` | **do not set** | The site never uses it; only the seed scripts and the test suite do. The server prints a warning at start-up if it is present |

The server checks its configuration when it starts. In production it refuses to
start — with the reason in the deployment log — if the Supabase address or key
is missing, or if a secret key has been put where a public one belongs
(`src/lib/env-check.ts`). Pick the Vercel function region nearest your Supabase
project's region: every page makes several database requests.
Preview deployments are never indexed (robots.txt disallows everything).

### 3. Before every release

```bash
npm run lint && npx tsc --noEmit && npm run check:i18n && npm test
npm run build
npm run check:secrets     # no service-role key in the build output or in git
npm run test:e2e          # against a TEST Supabase project — it creates accounts and orders
```

### 4. After deploying

```bash
npm run smoke -- https://www.your-shop.com
```

`smoke` is read-only, so it is safe on the live shop. It checks the public pages,
404s and sign-in redirects, the security headers, that robots.txt, the sitemap
and the canonical links use the real address (not localhost), and — with only
the public key — that a visitor cannot read orders, customers, addresses,
carts or hidden products. Then submit `/sitemap.xml` in Google Search Console.

### 5. Email (Resend)

The store sends four emails, through [Resend](https://resend.com). Supabase's
own account emails (password reset, sign-up) go through Resend too.

| Email | To | When |
| --- | --- | --- |
| Order confirmation | the customer, in their language | right after they order |
| Order update | the customer, in their language | the admin moves the order to Confirmed, Shipped, Delivered or Cancelled |
| New-order alert | you (`SHOP_NOTIFY_EMAIL`), in English | every new order; replying writes to the customer |
| Contact form | you, in English | a visitor sends the form on the Contact page; replying writes to them |

**How it works.**
- The database queues every email itself (migration `0019`). Right after an
  order, a status change or a contact message, the browser asks
  `/api/email/dispatch` to send what is queued, and the server sends it with
  Resend's API (`src/lib/email/resend.ts`).
- A failed send stays queued and is retried by the next dispatch, up to 5
  times. Each email carries an idempotency key, so a retry can't deliver it
  twice. Anything still unsent after 3 days is dropped, so switching email on
  later doesn't send old confirmations.
- Test addresses (`@example.com` and similar) are never mailed.
- The site still needs no service-role key: the server reads the queue with a
  secret of its own (`EMAIL_DISPATCH_SECRET`).

1. **Resend account.** Sign up at resend.com. The free plan has daily and
   monthly limits (see resend.com/pricing); a shop's order emails usually fit.
2. **Your domain.** *Domains* → **Add Domain** → your shop's domain (a
   subdomain like `mail.your-shop.com` works too). Add the DNS records Resend
   shows (SPF and DKIM; DMARC is recommended) at your domain registrar, then
   **Verify**. This is required: until a domain is verified, Resend only
   delivers to your own account's address, so customers would get nothing.
   It also keeps your emails out of spam.
3. **API key.** *API Keys* → **Create API Key** → permission **Sending
   access**, limited to that domain. Copy it (it starts with `re_` and is shown
   only once).
4. **The server's settings.** Add these to `.env` (local) and to Vercel
   (Production and Preview), then redeploy:

   | Variable | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the key from step 3 (`re_…`) |
   | `EMAIL_FROM` | `Evael Store <orders@your-shop.com>`, any address on the verified domain |
   | `SHOP_NOTIFY_EMAIL` | where new-order alerts and contact messages go, e.g. your Gmail |
   | `EMAIL_DISPATCH_SECRET` | a long random value (below) |

   Generate the secret once:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Then give the database the same value: Supabase → *SQL Editor*, run

   ```sql
   select public.set_email_dispatch_secret('PASTE-THE-SAME-VALUE-HERE');
   ```

   To change it later, run the same line with a new value and update the
   variable. `select public.set_email_dispatch_secret(null);` switches sending
   off completely.
5. **Account emails (password reset, sign-up) through Resend.** Supabase sends
   these itself.
   - **One click (easiest):** in Resend → *Settings → Integrations* → **Connect
     to Supabase**. Sign in to Supabase if asked, pick this project, pick your
     verified domain, and let Resend create an API key for it. Then add a
     sender name (`Evael Store`) and click **Configure SMTP Integration**.
     Resend fills in Supabase's SMTP settings for you.
   - **By hand (same result):** Supabase → *Authentication → Emails → SMTP
     Settings* → **Enable custom SMTP**. Sender email `orders@your-shop.com`,
     sender name `Evael Store`, host `smtp.resend.com`, port `465`, username
     `resend`, password = a Resend API key.
   - Then, under *Authentication → Rate Limits*, raise "emails sent per hour"
     (Supabase keeps it very low until custom SMTP is on).
   - Under *Emails → Templates → Reset Password*, set the link to
     `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
     so that a reset link also works when it is opened on another device.
   - Sign-up currently signs the customer in at once (*Sign In / Providers →
     Email → Confirm email* is off). If you turn it on, customers must click
     the mailed link and then sign in.
6. **Test.** Send the Contact form with your own address. Place a test order
   with a real email address, and move it to Shipped in the admin. Use
   "Forgot password" once. Every email, including Supabase's, shows up in
   Resend's *Emails* log with its delivery status. Check the spam folder the
   first time.
7. **Optional safety net.** Queued emails normally go out within seconds. If
   a send fails, it waits for the next order or message. To retry sooner,
   have any free uptime/cron service (cron-job.org, UptimeRobot…) send
   `POST https://www.your-shop.com/api/email/dispatch` every 5–10 minutes.
   Anyone may call it: it only sends what is already queued.

**What's in the queue** (SQL Editor): `select kind, state, attempts, last_error,
created_at from email_outbox order by created_at desc limit 20;` An invalid
key or an unverified sender domain shows up in `last_error`. Contact messages are also kept in
the `contact_messages` table.

### Security

- **Database.** Row-level security is on for every table; customers can only
  read and change their own carts, addresses, favorites and orders. Orders are
  created only by the `place_order` function, which prices them on the server.
  Storage is public-read but admin-write, limited to JPEG/PNG/WebP up to 5 MB.
  `/admin` is checked on the server and again by the database.
- **Browser.** Every response carries `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` and a
  Content-Security-Policy: code and requests only to this site and this Supabase
  project, no framing, no plug-ins, and pictures from any https address (an
  administrator can paste an outside photo link into a product) (`next.config.ts`). Scripts and styles
  still allow `'unsafe-inline'`, because Next.js hydrates pages with inline
  scripts; a per-request nonce would remove that, but forces every page to be
  rendered on each request. The site has no user-written HTML, which is why it
  is not worth that today.
- **Secrets.** `npm run check:secrets` recognises Supabase keys by what they are
  (a JWT's `role` claim, the `sb_secret_` prefix, the literal value of your
  service-role key) and fails if one is in the built site or committed to git.
- **Accepted on purpose.** Supabase's advisors still list `is_admin()` and
  `subscribe_to_newsletter()` as callable by visitors. `is_admin()` runs inside
  the row-level-security rules with the visitor's own privileges and only
  answers about the caller; the newsletter sign-up is meant to be public. It has
  no rate limit, so if it is abused, add one in Vercel's firewall.
- **Not included.** No error-monitoring service (server errors go to Vercel's
  logs; `instrumentation.ts` is where to attach Sentry or similar), and the CSP
  is not nonce-based (above).
