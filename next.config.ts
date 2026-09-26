import type { NextConfig } from "next";
import path from "path";

// Product and category photos live in Supabase Storage (public buckets). They
// are served through Next's image optimizer — resized to the size actually
// shown, converted to WebP, cached — instead of downloading the 1600px original
// for every thumbnail. Only images from THIS project's public storage may be
// optimized (the optimizer fetches whatever it is pointed at, so it is
// restricted to the one place we upload to).
//
// A missing or malformed address must not crash the config with a cryptic
// "Invalid URL": the server's start-up check (src/instrumentation.ts) reports
// it in words, so here it simply yields no allowed origin.
function originOf(value: string | undefined): string {
  try {
    return value ? new URL(value).origin : "";
  } catch {
    return "";
  }
}
const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Content Security Policy: the browser may only talk to this site and this
// Supabase project, run and load code only from this site, and never be framed.
// The one exception is pictures: an administrator can give a product a photo
// from any https address, and a picture cannot run code.
//
// Scripts and styles keep 'unsafe-inline' because Next.js hydrates pages with
// inline scripts it writes itself and the UI libraries set inline styles. A
// per-request nonce would remove that, but forces every page to be rendered on
// each request and needs every inline script to carry it — not worth the risk
// for this shop (there is no user-written HTML anywhere; JSON-LD is escaped).
// Everything else below is strict. Production only: the dev server needs eval
// and a websocket for hot reloading.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  // Do not guess a file's type from its content.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Never shown inside someone else's page (older browsers ignore the CSP above).
  { key: "X-Frame-Options", value: "DENY" },
  // Send other sites only the origin, not full addresses (order pages, search terms).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs the camera, microphone, location or payment sheets.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(process.env.NODE_ENV === "production"
    ? [
        // HTTPS only, for two years (browsers ignore this over plain http, so
        // running the production build on localhost is unaffected).
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
      ]
    : []),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Do not advertise the framework in an `X-Powered-By` header.
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseOrigin ? [new URL(`${supabaseOrigin}/storage/v1/object/public/**`)] : [],
    // Uploaded files get a random name and are never overwritten (see
    // lib/services/storage.ts), so a cached optimized copy can't go stale.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
