import Link from "next/link"
import { ListChecks } from "lucide-react"

import { categoryNameOf } from "@/lib/i18n/content"
import { getT } from "@/lib/i18n/server"
import type { ProductWithCategory } from "@/lib/services/catalog"
import { getStockStatus } from "@/lib/services/catalog"

async function ProductDetailsSection({ product }: { product: ProductWithCategory }) {
  const t = await getT()
  const stock = getStockStatus(product.stock, t)

  return (
    <section className="space-y-4 rounded-card border border-border/70 bg-card p-5 shadow-soft sm:p-6">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-charcoal">
        <ListChecks aria-hidden className="size-5 text-forest" strokeWidth={1.75} />
        {t("product.details.title")}
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
        <dt className="text-muted-text">{t("product.details.sku")}</dt>
        <dd className="text-charcoal">{product.sku}</dd>
        <dt className="text-muted-text">{t("product.details.category")}</dt>
        <dd>
          <Link
            href={`/category/${product.categorySlug}`}
            className="text-charcoal underline-offset-4 hover:text-forest hover:underline"
          >
            {categoryNameOf(product, t.locale)}
          </Link>
        </dd>
        <dt className="text-muted-text">{t("product.details.availability")}</dt>
        <dd className={stock.className}>{stock.label}</dd>
      </dl>
    </section>
  )
}

export { ProductDetailsSection }
