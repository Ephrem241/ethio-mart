"use client"

import { useRouter } from "next/navigation"
import { cn } from "cn"

import type { SortOption } from "@/lib/services/catalog"
import { buildSortUrl, type RawParams } from "@/components/catalog/listing-url"

const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  popular: "Most Popular",
}

function SortSelect({
  value,
  rawParams,
  basePath,
  className,
}: {
  value: SortOption
  rawParams: RawParams
  basePath: string
  className?: string
}) {
  const router = useRouter()

  return (
    <select
      value={value}
      onChange={(e) => router.push(buildSortUrl(basePath, rawParams, e.target.value))}
      aria-label="Sort products"
      className={cn(
        "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-charcoal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {Object.entries(SORT_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}

export { SortSelect }
