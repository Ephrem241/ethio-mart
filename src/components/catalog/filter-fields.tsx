"use client"

import type { FilterFacets } from "@/lib/services/catalog"
import { RATING_THRESHOLDS } from "@/lib/services/catalog"
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
  return (
    <div className="space-y-6">
      {showCategory && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-charcoal">Category</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-text">
            <input
              type="radio"
              name="category"
              className="accent-burgundy"
              checked={!filters.categorySlug}
              onChange={() => onChange({ ...filters, categorySlug: undefined })}
            />
            All categories
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
                  className="accent-burgundy"
                  checked={filters.categorySlug === c.slug}
                  onChange={() => onChange({ ...filters, categorySlug: c.slug })}
                />
                {c.name}
              </span>
              <span className="text-xs">{c.count}</span>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">Price</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-text">
          <input
            type="radio"
            name="price"
            className="accent-burgundy"
            checked={!filters.priceBucket}
            onChange={() => onChange({ ...filters, priceBucket: undefined })}
          />
          Any price
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
                className="accent-burgundy"
                checked={filters.priceBucket === b.id}
                onChange={() => onChange({ ...filters, priceBucket: b.id })}
              />
              {b.label}
            </span>
            <span className="text-xs">{b.count}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">Availability</legend>
        <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-text">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-burgundy"
              checked={!!filters.inStockOnly}
              onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            />
            In stock only
          </span>
          <span className="text-xs">{facets.inStockCount}</span>
        </label>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">Rating</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-text">
          <input
            type="radio"
            name="rating"
            className="accent-burgundy"
            checked={filters.minRating == null}
            onChange={() => onChange({ ...filters, minRating: undefined })}
          />
          Any rating
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
                  className="accent-burgundy"
                  checked={filters.minRating === min}
                  onChange={() => onChange({ ...filters, minRating: min })}
                />
                {min}★ &amp; up
              </span>
              <span className="text-xs">{facet?.count ?? 0}</span>
            </label>
          )
        })}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-charcoal">Discount</legend>
        <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-text">
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-burgundy"
              checked={!!filters.onSaleOnly}
              onChange={(e) => onChange({ ...filters, onSaleOnly: e.target.checked })}
            />
            On sale
          </span>
          <span className="text-xs">{facets.onSaleCount}</span>
        </label>
      </fieldset>
    </div>
  )
}

export { FilterFields }
