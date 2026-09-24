"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"

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
      <SheetHeader>
        <SheetTitle>{t("catalog.filters.title")}</SheetTitle>
      </SheetHeader>
      <div className="px-4">
        <FilterFields filters={draft} facets={facets} showCategory={showCategory} onChange={setDraft} />
      </div>
      <SheetFooter className="flex-row gap-2">
        <Button variant="outline" className="flex-1" onClick={onClear}>
          {t("catalog.filters.clearAll")}
        </Button>
        <Button className="flex-1" onClick={() => onApply(draft)}>
          {t("catalog.filters.apply")}
        </Button>
      </SheetFooter>
    </>
  )
}

function FilterDrawer({
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
  const t = useT()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

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
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-4" />
          {t("catalog.filters.open")}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
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
