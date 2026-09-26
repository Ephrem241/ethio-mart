import { expect, test } from "@playwright/test"

// Phase 18: what every response must carry, and what must not be reachable in
// production. (`next start` serves the production headers; `next dev` leaves out
// the CSP and HSTS, so this suite is for a production build.)
const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://missing.invalid").origin

const PAGES = ["/", "/shop", "/login", "/cart", "/product/does-not-exist", "/robots.txt", "/sitemap.xml"]

test.describe("Security headers", () => {
  for (const path of PAGES) {
    test(`${path} is served with them`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 })
      const headers = response.headers()

      expect(headers["x-content-type-options"]).toBe("nosniff")
      expect(headers["x-frame-options"]).toBe("DENY")
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
      expect(headers["permissions-policy"]).toContain("camera=()")
      expect(headers["strict-transport-security"]).toMatch(/max-age=\d+/)
      expect(headers["x-powered-by"]).toBeUndefined()

      const csp = headers["content-security-policy"] ?? ""
      for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"]) {
        expect(csp, directive).toContain(directive)
      }
      // Requests and code: this site and this Supabase project, nobody else.
      expect(csp).toContain(`connect-src 'self' ${supabaseOrigin};`)
      expect(csp).toContain("script-src 'self' 'unsafe-inline';")
      // Pictures may come from any https address (an administrator can paste a photo link), but nothing else may.
      expect(csp).toContain("img-src 'self' data: blob: https:;")
      expect(csp).not.toMatch(/\*/)
    })
  }

  test("the static files the pages load carry them too", async ({ request }) => {
    const home = await (await request.get("/")).text()
    const asset = home.match(/\/_next\/static\/[^"']+\.(?:css|js)/)?.[0]
    expect(asset, "the home page links a static file").toBeTruthy()
    const headers = (await request.get(asset!)).headers()
    expect(headers["x-content-type-options"]).toBe("nosniff")
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'")
  })
})

test.describe("Not part of the public site", () => {
  test("the design-system page (a developer tool) is a 404", async ({ request }) => {
    expect((await request.get("/style-guide")).status()).toBe(404)
  })

  test("nothing about the framework or the server internals is advertised", async ({ request }) => {
    const headers = (await request.get("/")).headers()
    expect(headers["x-powered-by"]).toBeUndefined()
    expect(headers["server"] ?? "").not.toMatch(/\d/) // no version numbers
  })
})
