"use client"

import { useRouter } from "next/navigation"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import type { SortOption } from "@/lib/services/catalog"
import { buildSortUrl, type RawParams } from "@/components/catalog/listing-url"

const SORT_OPTIONS: SortOption[] = ["recommended", "newest", "price-asc", "price-desc", "popular"]

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
  const t = useT()
  const router = useRouter()

  return (
    <select
      value={value}
      onChange={(e) => router.push(buildSortUrl(basePath, rawParams, e.target.value))}
      aria-label={t("catalog.sort.label")}
      className={cn(
        "h-10 rounded-xl border border-input bg-card px-3 text-sm text-charcoal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {SORT_OPTIONS.map((key) => (
        <option key={key} value={key}>
          {t(`catalog.sort.${key}`)}
        </option>
      ))}
    </select>
  )
}

export { SortSelect }
