"use client"

import Link from "next/link"

import type { OrderItemRecord } from "@/lib/types/orders"
import { useProductsByIds } from "@/lib/hooks/use-products-by-ids"
import { getCategoryIcon } from "@/components/product/category-icons"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { Price } from "@/components/product/price"

// Items are a point-in-time snapshot (product_name/unit_price/total were
// captured at checkout) — the numbers never depend on a live product
// lookup. A live product is only used, when it still exists, to link the
// row and render its image; a deactivated/deleted product falls back to
// plain text rather than a dead link.
function OrderItemsSection({ items }: { items: OrderItemRecord[] }) {
  const { products } = useProductsByIds(
    items.map((item) => item.product_id).filter((id): id is string => id !== null)
  )
  const productsById = new Map(products.map((p) => [p.id, p]))

  return (
    <section className="space-y-3 rounded-card border border-border bg-card p-5">
      <h2 className="font-medium text-charcoal">Products</h2>
      <div>
        {items.map((item) => {
          const product = item.product_id ? productsById.get(item.product_id) : undefined

          return (
            <div key={item.id} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
              {product ? (
                <Link href={`/product/${product.slug}`} className="w-14 shrink-0">
                  <ImagePlaceholder
                    seed={product.id}
                    icon={getCategoryIcon(product.categorySlug)}
                    label={item.product_name}
                    imageUrl={product.image_url}
                  />
                </Link>
              ) : (
                <div className="size-14 shrink-0 rounded-image bg-sand/40" />
              )}
              <div className="flex-1">
                {product ? (
                  <Link href={`/product/${product.slug}`} className="text-sm font-medium text-charcoal hover:underline">
                    {item.product_name}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                )}
                <p className="text-xs text-muted-text">
                  Qty {item.quantity} × {item.unit_price.toLocaleString()} ETB
                </p>
              </div>
              <Price amount={item.total} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export { OrderItemsSection }
