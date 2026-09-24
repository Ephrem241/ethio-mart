"use client"

import { useRouter } from "next/navigation"

import type { FilterFacets } from "@/lib/services/catalog"
import { FilterFields } from "@/components/catalog/filter-fields"
import { buildFilterUrl, type FilterValues, type RawParams } from "@/components/catalog/listing-url"

function FilterSidebar({
  filters,
  facets,
  showCategory = true,
  rawParams,
  basePath,
}: {
  filters: FilterValues
  facets: FilterFacets
  showCategory?: boolean
  rawParams: RawParams
  basePath: string
}) {
  const router = useRouter()

  return (
    <aside className="sticky top-32 hidden w-64 shrink-0 rounded-card border border-border/70 bg-card p-5 shadow-soft lg:block">
      <FilterFields
        filters={filters}
        facets={facets}
        showCategory={showCategory}
        onChange={(next) => router.push(buildFilterUrl(basePath, rawParams, next))}
      />
    </aside>
  )
}

export { FilterSidebar }
