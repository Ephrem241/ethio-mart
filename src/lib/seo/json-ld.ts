import type { Product } from "@/lib/data/products"
import { SITE_NAME, absoluteUrl } from "@/lib/seo/site"

// schema.org structured data (JSON-LD). Builders return plain objects; the
// <JsonLd> component wraps them in a single @graph with the @context.
//
// Only facts the store actually has are stated. Deliberately NOT emitted:
//  - aggregateRating: product ratings are seeded numbers with no reviews
//    behind them (the reviews table is empty), and search engines treat rating
//    markup without real reviews as misleading;
//  - social profiles, phone numbers, addresses: none are configured yet.

export type JsonLdNode = Record<string, unknown>

export function organizationJsonLd(description: string): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/apple-icon"),
    description,
  }
}

// (Each page's data stands alone: nodes reference each other by @id only
// within the same page — the Organization and WebSite live on the home page.)

// The search box a shopper sees in the header, described for search engines.
export function websiteJsonLd(inLanguage: string): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  }
}

export function collectionJsonLd(input: { name: string; description: string; url: string; inLanguage: string }): JsonLdNode {
  return {
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.url),
    inLanguage: input.inLanguage,
  }
}

export function productJsonLd(input: {
  product: Pick<Product, "sku" | "price" | "stock" | "image_url">
  name: string
  description: string
  url: string
  categoryName: string
}): JsonLdNode {
  const { product } = input
  return {
    "@type": "Product",
    name: input.name,
    description: input.description,
    sku: product.sku,
    category: input.categoryName,
    ...(product.image_url ? { image: [absoluteUrl(product.image_url)] } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(input.url),
      priceCurrency: "ETB",
      price: String(product.price),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  }
}
