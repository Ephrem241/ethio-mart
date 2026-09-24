import { BRAND_NAME } from "@/lib/brand"

// The address the site is served from. Everything an outside party reads —
// canonical links, the sitemap, Open Graph URLs, structured data — must be an
// ABSOLUTE URL, so it all derives from this one value.
//
// Order: NEXT_PUBLIC_SITE_URL (set it for every real deployment), then the
// production hostname Vercel injects, then localhost so `next dev` just works.
function resolveSiteUrl(): { url: string; configured: boolean } {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const candidate = explicit || (vercel ? `https://${vercel}` : "")

  if (candidate) {
    try {
      const parsed = new URL(candidate)
      return { url: parsed.origin + parsed.pathname.replace(/\/$/, ""), configured: true }
    } catch {
      // fall through to the warning below
    }
  }
  return { url: "http://localhost:3000", configured: false }
}

const resolved = resolveSiteUrl()

if (!resolved.configured && process.env.NODE_ENV === "production" && !globalThis.__siteUrlWarned) {
  globalThis.__siteUrlWarned = true
  console.warn(
    "[seo] NEXT_PUBLIC_SITE_URL is not set: canonical URLs, the sitemap and Open Graph links will point at http://localhost:3000. Set it to the public address of the site."
  )
}

declare global {
  var __siteUrlWarned: boolean | undefined
}

export const SITE_URL = resolved.url
export const SITE_NAME = BRAND_NAME

// "/product/x" -> "https://site/product/x". Already-absolute URLs pass through.
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`
}

// Preview/staging deployments must not be indexed; only a real production
// deployment (or a non-Vercel host) may be crawled.
export function isIndexableDeployment(): boolean {
  const env = process.env.VERCEL_ENV
  return !env || env === "production"
}
