import type { MetadataRoute } from "next"

import { absoluteUrl, isIndexableDeployment } from "@/lib/seo/site"

// What crawlers may fetch. Two different tools are used on purpose:
//  - Disallow (here) for areas that are private or need a sign-in anyway
//    (there is nothing useful for a crawler to read, and a crawler that gets
//    redirected to /login learns nothing);
//  - `noindex` (page metadata) for pages that are public but shouldn't be in
//    search results — cart, sign-in, search and sort/filter variants. Those
//    stay crawlable ON PURPOSE: a crawler must be able to fetch a page to see
//    its noindex; blocking it here would hide that instruction.
export default function robots(): MetadataRoute.Robots {
  // Preview/staging deployments are never indexed.
  if (!isIndexableDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/orders/", "/order/", "/auth/", "/style-guide"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
