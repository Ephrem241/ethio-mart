"use client"

import { nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
import type { FilterFacets } from "@/lib/services/catalog"
import { RATING_THRESHOLDS, priceBucketLabel } from "@/lib/services/catalog"
import type { FilterValues } from "@/components/catalog/listing-url"

function FilterFields({
  filters,
  facets,
  showCategory = true,
  onChange,
}: {
  filters: FilterValues
  facets: FilterFacets
  showCategory?: boolean
  onChange: (next: FilterValues) => void
}) {
  const t = useT()

  return (
    <div className="space-y-6">
      {showCategory && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-charcoal">{t("catalog.filters.category")}</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-text">
            <input
              type="radio"
              name="category"
              className="accent-forest"
              checked={!filters.categorySlug}
              onChange={() => onChange({ ...filters, categorySlug: undefined })}
            />
            {t("catalog.filters.allCategories")}
          </label>
          {facets.categories.map((c) => (
            <label
              key={c.slug}
              className="flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-text"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  className="accent-forest"
                  checked={filters.categorySlug === c.slug}
                  onChange={() => onChange({ ...filters, categorySlug: c.slug })}
                />
                {nameOf({ name_en: c.name, name_am: c.nameAm }, t.locale)}
              </span>
              <span className="text-xs">{c.count}</span>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">{t("catalog.filters.price")}</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-text">
          <input
            type="radio"
            name="price"
            className="accent-forest"
            checked={!filters.priceBucket}
            onChange={() => onChange({ ...filters, priceBucket: undefined })}
          />
          {t("catalog.filters.anyPrice")}
        </label>
        {facets.priceBuckets.map((b) => (
          <label
            key={b.id}
            className="flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-text"
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="price"
                className="accent-forest"
                checked={filters.priceBucket === b.id}
                onChange={() => onChange({ ...filters, priceBucket: b.id })}
              />
              {priceBucketLabel(b.id, t)}
            </span>
            <span className="text-xs">{b.count}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">{t("catalog.filters.availability")}</legend>
        <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-text">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-forest"
              checked={!!filters.inStockOnly}
              onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            />
            {t("catalog.filters.inStockOnly")}
          </span>
          <span className="text-xs">{facets.inStockCount}</span>
        </label>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">{t("catalog.filters.rating")}</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-text">
          <input
            type="radio"
            name="rating"
            className="accent-forest"
            checked={filters.minRating == null}
            onChange={() => onChange({ ...filters, minRating: undefined })}
          />
          {t("catalog.filters.anyRating")}
        </label>
        {RATING_THRESHOLDS.map((min) => {
          const facet = facets.ratingCounts.find((r) => r.min === min)
          return (
            <label
              key={min}
              className="flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-text"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rating"
                  className="accent-forest"
                  checked={filters.minRating === min}
                  onChange={() => onChange({ ...filters, minRating: min })}
                />
                {t("catalog.filters.ratingUp", { min })}
              </span>
              <span className="text-xs">{facet?.count ?? 0}</span>
            </label>
          )
        })}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">{t("catalog.filters.discount")}</legend>
        <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-text">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-forest"
              checked={!!filters.onSaleOnly}
              onChange={(e) => onChange({ ...filters, onSaleOnly: e.target.checked })}
            />
            {t("catalog.filters.onSale")}
          </span>
          <span className="text-xs">{facets.onSaleCount}</span>
        </label>
      </fieldset>
    </div>
  )
}

export { FilterFields }
