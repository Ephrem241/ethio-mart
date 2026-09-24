import type { Metadata } from "next"

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import type { Translator } from "@/lib/i18n/translator"
import { SITE_NAME, absoluteUrl } from "@/lib/seo/site"

// One place that decides what a page tells search engines and link previews.
//
// Language and URLs: the site has ONE URL per page, and the language comes
// from the visitor's cookie. Crawlers send no cookies, so every public page
// also answers to `?lang=am` (honored by src/proxy.ts) — that is what makes
// the Amharic version separately crawlable and linkable. Each language
// declares itself canonical and points at the other via hreflang.

export const OG_LOCALE: Record<Locale, string> = { en: "en_US", am: "am_ET" }

// Query params that only re-sort/re-filter the same products. Such URLs would
// otherwise compete with the plain listing (and with /category/[slug]).
const FACET_PARAMS = ["category", "price", "stock", "rating", "sort", "q"] as const

type RawParams = Record<string, string | string[] | undefined>
export type ListingParams = { page?: number; sale?: boolean }

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// "/shop" + { sale, page: 2 } + "am" -> "/shop?sale=1&page=2&lang=am"
export function pagePath(path: string, locale: Locale, params: ListingParams = {}): string {
  const query = new URLSearchParams()
  if (params.sale) query.set("sale", "1")
  if (params.page && params.page > 1) query.set("page", String(params.page))
  if (locale !== DEFAULT_LOCALE) query.set("lang", locale)
  const qs = query.toString()
  return qs ? `${path}?${qs}` : path
}

// What a listing page (/shop, /category/x) may say about itself.
//  - the plain listing, its numbered pages, and the "on sale" view are indexable
//    and canonical to themselves;
//  - any sort/filter/search combination is a re-arrangement of the same
//    products: not indexed, and canonical to the plain listing.
export function listingSeo(
  raw: RawParams,
  { allowSale }: { allowSale: boolean }
): { indexable: boolean; params: ListingParams } {
  // On /shop the "on sale" view is the Deals page and worth indexing; inside a
  // category it is just another filter.
  const sale = first(raw.sale) === "1"
  const hasFacet = FACET_PARAMS.some((key) => first(raw[key])) || (sale && !allowSale)
  const page = Number(first(raw.page))
  const validPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : undefined
  if (hasFacet) return { indexable: false, params: {} }
  return { indexable: true, params: { sale, page: validPage } }
}

// "Shop" -> "Shop — Page 2" so numbered pages don't share one <title>.
export function withPageNumber(title: string, page: number | undefined, t: Translator): string {
  return page && page > 1 ? `${title} — ${t("catalog.pageLabel", { page })}` : title
}

// Keep a description within what search results show (~155-160 characters),
// cutting at a word boundary.
export function truncateDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`
}

export interface PageMetadataInput {
  locale: Locale
  path: string // canonical path WITHOUT the language param, e.g. "/product/x"
  title?: string
  // Title for link previews when it should differ from <title> (the home page
  // has no page-specific <title>; it uses the site default).
  socialTitle?: string
  description: string
  image?: { url: string; alt: string } | null
  listing?: ListingParams
  // false => hidden from search results, and canonical to the plain path
  indexable?: boolean
}

// Full metadata for a PUBLIC page.
export function pageMetadata({
  locale,
  path,
  title,
  socialTitle,
  description,
  image,
  listing = {},
  indexable = true,
}: PageMetadataInput): Metadata {
  const shownTitle = socialTitle ?? title ?? SITE_NAME
  // A page that declares its own `openGraph` REPLACES the site-wide one it
  // would inherit — including the default share image — so every public page
  // states its image explicitly: its own photo, else the site image.
  const shareImage = image
    ? { url: absoluteUrl(image.url), alt: image.alt }
    : { url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: SITE_NAME }
  const canonicalTarget = indexable ? listing : {}
  const canonical = pagePath(path, locale, canonicalTarget)
  const languages = {
    en: pagePath(path, "en", canonicalTarget),
    am: pagePath(path, "am", canonicalTarget),
    "x-default": pagePath(path, "en", canonicalTarget),
  }

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical, languages },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[locale === "en" ? "am" : "en"]],
      url: canonical,
      title: shownTitle,
      description,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shownTitle,
      description,
      images: [shareImage.url],
    },
  }
}

// Pages that belong to one person or one transaction (cart, checkout, account,
// admin, sign-in): never listed, and their links aren't followed either.
export function privateMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } }
}
