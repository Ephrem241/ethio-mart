"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import type { FilterFacets } from "@/lib/services/catalog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { FilterFields } from "@/components/catalog/filter-fields"
import { buildFilterUrl, type FilterValues, type RawParams } from "@/components/catalog/listing-url"

// Only rendered while the sheet is open (see the `{open && ...}` guard
// below), so its draft state always starts fresh from the current committed
// `filters` on mount — no effect needed to re-sync it when the sheet
// reopens (avoids react-hooks/set-state-in-effect).
function FilterDrawerBody({
  filters,
  facets,
  showCategory,
  onApply,
  onClear,
}: {
  filters: FilterValues
  facets: FilterFacets
  showCategory: boolean
  onApply: (next: FilterValues) => void
  onClear: () => void
}) {
  const t = useT()
  const [draft, setDraft] = React.useState<FilterValues>(filters)

  return (
    <>
      <SheetHeader className="pt-2">
        <SheetTitle>{t("catalog.filters.title")}</SheetTitle>
      </SheetHeader>
      {/* Only the options scroll; the title and the two buttons stay put. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        <FilterFields filters={draft} facets={facets} showCategory={showCategory} onChange={setDraft} />
      </div>
      <SheetFooter className="flex-row gap-2 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button variant="outline" size="lg" className="flex-1" onClick={onClear}>
          {t("catalog.filters.clearAll")}
        </Button>
        <Button size="lg" className="flex-1" onClick={() => onApply(draft)}>
          {t("catalog.filters.apply")}
        </Button>
      </SheetFooter>
    </>
  )
}

// How many filters the shopper has switched on (a category page's own
// category is the page, not a filter, so it only counts where it can be chosen).
function countActive(filters: FilterValues, showCategory: boolean): number {
  return (
    (showCategory && filters.categorySlug ? 1 : 0) +
    (filters.priceBucket ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minRating != null ? 1 : 0) +
    (filters.onSaleOnly ? 1 : 0)
  )
}

// Phones and tablets only (the desktop has FilterSidebar): a sheet that slides
// up from the bottom, as shopping apps do, at most 85% of the screen high.
function FilterDrawer({
  filters,
  facets,
  showCategory = true,
  rawParams,
  basePath,
  className,
}: {
  filters: FilterValues
  facets: FilterFacets
  showCategory?: boolean
  rawParams: RawParams
  basePath: string
  className?: string
}) {
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const active = countActive(filters, showCategory)

  function apply(next: FilterValues) {
    router.push(buildFilterUrl(basePath, rawParams, next))
    setOpen(false)
  }

  function clearAll() {
    router.push(buildFilterUrl(basePath, rawParams, {}))
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5", className)}>
          <SlidersHorizontal aria-hidden className="size-4" />
          {t("catalog.filters.open")}
          {active > 0 && (
            <>
              <span
                aria-hidden
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1.5 text-xs font-semibold text-white"
              >
                {active}
              </span>
              <span className="sr-only">, {t.plural("catalog.filters.activeCount", active)}</span>
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-2xl">
        {/* The grab handle every bottom sheet has (the sheet closes with its X, Escape or a tap outside). */}
        <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border" />
        {open && (
          <FilterDrawerBody
            filters={filters}
            facets={facets}
            showCategory={showCategory}
            onApply={apply}
            onClear={clearAll}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

export { FilterDrawer }
