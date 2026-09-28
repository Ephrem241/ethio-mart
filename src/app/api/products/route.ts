import { NextResponse, type NextRequest } from "next/server"

import { parseListingParams } from "@/lib/services/catalog"
import { getProducts } from "@/lib/services/catalog-queries"

// One page of a product listing, as JSON: what "Load more" on phones and
// tablets adds below the grid (components/catalog/load-more-products.tsx).
//
// It takes the listing's own query string (category, q, price, stock, rating,
// sale, sort, page) and answers through the same code the pages use
// (parseListingParams + getProducts), so it returns exactly the products the
// page shows at `?page=N`. Read-only and public, like the pages: only active
// products, and nothing a visitor couldn't already see by paging.
//
// A Route Handler rather than a Server Function: this is a read, and Server
// Functions are meant for changes (the client runs them one at a time, and
// they can't be cached).
export async function GET(request: NextRequest) {
  const raw: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    if (!(key in raw)) raw[key] = value // the first value wins, as on the pages
  })
  const { products, page, pageSize, total, totalPages } = await getProducts(parseListingParams(raw))
  return NextResponse.json({ products, page, pageSize, total, totalPages })
}
