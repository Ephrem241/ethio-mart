// A quick, READ-ONLY health check of a running site — safe to point at the real
// production address right after a deploy (it only makes GET requests, creates
// nothing, and needs no login):
//
//   npm run smoke                              # http://localhost:3000 (npm run start)
//   npm run smoke -- https://www.your-shop.com
//
// It checks that the public pages answer, that unknown and private addresses
// behave, that the security headers are on, that robots.txt, the sitemap and the
// canonical links use the site's real address (not localhost), and — using only
// the public key — that the database refuses to show private tables to a
// visitor who is not signed in. The fuller browser suite (`npm run test:e2e`)
// creates accounts and orders, so it must NOT be pointed at a live shop.

export {} // (makes this a module, so its names do not clash with browser globals such as `origin`)

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "")
const origin = new URL(base)
const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
const isHttps = origin.protocol === "https:"

let failures = 0
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++
  console.log(`${ok ? "  ok " : " FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}
const section = (title: string) => console.log(`\n${title}`)

async function get(pathname: string, init: RequestInit = {}) {
  return fetch(`${base}${pathname}`, { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init })
}

async function main() {
  console.log(`Smoke test of ${base}${isLocal ? " (local)" : ""}`)

  section("Public pages")
  for (const pathname of ["/", "/shop", "/categories", "/deals", "/about", "/contact", "/faq", "/delivery", "/returns", "/privacy", "/terms", "/login", "/register", "/cart"]) {
    // /deals redirects to the sale listing; everything else answers directly.
    const response = await get(pathname, { redirect: "follow" })
    const html = await response.text()
    const headings = (html.match(/<h1[\s>]/g) ?? []).length
    check(`${pathname} answers with a page`, response.status === 200 && /<title>[^<]+<\/title>/.test(html) && headings === 1, `${response.status}, ${headings} h1`)
  }

  section("Addresses that must not work")
  for (const [pathname, expected] of [["/this-page-does-not-exist", 404], ["/product/does-not-exist", 404], ["/category/does-not-exist", 404], ["/product/%FF", 404], ["/style-guide", isLocal ? null : 404]] as const) {
    const response = await get(pathname)
    check(`${pathname} is ${expected ?? "hidden in production"}`, expected === null ? response.status < 500 : response.status === expected, `${response.status}`)
  }
  for (const pathname of ["/admin", "/account", "/checkout", "/orders/00000000-0000-0000-0000-000000000000"]) {
    const response = await get(pathname)
    const location = response.headers.get("location") ?? ""
    check(`${pathname} sends a visitor who is not signed in to the login page`, response.status >= 300 && response.status < 400 && location.includes("/login"), `${response.status} ${location}`)
  }

  section("Security headers (on the home page)")
  const home = await get("/", { redirect: "follow" })
  const header = (name: string) => home.headers.get(name) ?? ""
  check("X-Content-Type-Options: nosniff", header("x-content-type-options") === "nosniff")
  check("X-Frame-Options: DENY", header("x-frame-options").toUpperCase() === "DENY")
  check("Referrer-Policy is set", header("referrer-policy") !== "", header("referrer-policy"))
  check("Permissions-Policy is set", header("permissions-policy") !== "")
  check("no X-Powered-By header", header("x-powered-by") === "", header("x-powered-by"))
  const csp = header("content-security-policy")
  check("Content-Security-Policy stops framing and objects", csp === "" ? isLocal : csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"), csp === "" ? "absent (fine for a local dev server)" : "")
  if (isHttps) check("Strict-Transport-Security is set", header("strict-transport-security").includes("max-age="), header("strict-transport-security"))

  section("Search engines and the site's real address")
  const robots = await get("/robots.txt")
  const robotsText = await robots.text()
  check("robots.txt answers", robots.status === 200)
  if (!isLocal) {
    check("robots.txt allows the shop but keeps private areas out", /Allow:\s*\//i.test(robotsText) && /Disallow:\s*\/admin/i.test(robotsText), /Disallow:\s*\/\s*$/im.test(robotsText) ? "everything is disallowed — is this a preview deployment?" : "")
    check("robots.txt points at the sitemap on this address", robotsText.includes(`${origin.origin}/sitemap.xml`))
  }
  const sitemap = await get("/sitemap.xml")
  const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  check("sitemap.xml lists pages", sitemap.status === 200 && locs.length > 5, `${locs.length} addresses`)
  if (!isLocal) {
    const foreign = locs.filter((loc) => new URL(loc).origin !== origin.origin)
    check("every sitemap address is on this site (NEXT_PUBLIC_SITE_URL is right)", foreign.length === 0, foreign[0] ?? "")
    const html = await (await get("/", { redirect: "follow" })).text()
    check("canonical link is on this site", html.includes(`rel="canonical" href="${origin.origin}`))
    check("the home page mentions no localhost address", !/https?:\/\/localhost/.test(html))
  }
  if (!isLocal && isHttps) {
    const plain = await fetch(`http://${origin.host}/`, { redirect: "manual", signal: AbortSignal.timeout(30_000) }).catch(() => null)
    check("plain http is sent to https", !!plain && plain.status >= 300 && plain.status < 400 && (plain.headers.get("location") ?? "").startsWith("https://"), plain ? `${plain.status}` : "no answer")
  }

  section("Database, as an anonymous visitor (public key only)")
  console.log("  (an empty table also shows 0 rows, so this is most telling once the shop has orders and customers)")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !anonKey) {
    console.log("  skipped — run through `npm run smoke` so .env supplies NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
  } else {
    const rows = async (table: string, query = "select=*&limit=5") => {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, signal: AbortSignal.timeout(30_000) })
      const body: unknown = await response.json().catch(() => null)
      return { status: response.status, count: Array.isArray(body) ? body.length : null }
    }
    for (const table of ["orders", "order_items", "profiles", "addresses", "cart_items", "favorites", "newsletter_subscribers", "promotions"]) {
      const result = await rows(table)
      check(`${table}: a visitor sees nothing`, result.count === 0 || result.status >= 400, `${result.status}, ${result.count ?? "no"} rows`)
    }
    const products = await rows("products", "select=id&limit=1")
    check("products: the public catalog is readable", products.status === 200 && (products.count ?? 0) > 0)
    const hidden = await rows("products", "select=id&is_active=eq.false&limit=1")
    check("products: hidden products stay hidden", hidden.count === 0 || hidden.status >= 400, `${hidden.count} rows`)
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`)
  process.exitCode = failures === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(`\nCould not finish: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 2
})
