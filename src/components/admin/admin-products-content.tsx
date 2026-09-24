"use client"

import { TableSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { toast } from "sonner"
import { PackageX, Pencil, Trash2 } from "lucide-react"

import { nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
import { useAdminCategories, useAdminProducts } from "@/lib/hooks/use-admin-data"
import { deleteProduct, setProductActive, setProductFeatured } from "@/lib/services/admin-catalog"
import { getCategoryIcon } from "@/components/product/category-icons"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { formatPrice } from "@/lib/currency"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

function AdminProductsContent() {
  const t = useT()
  const { data: products, loading: productsLoading, reload } = useAdminProducts()
  const { data: categories, loading: categoriesLoading } = useAdminCategories()

  if (productsLoading || categoriesLoading) return <TableSkeleton columns={8} />

  if (!products || !categories) {
    return <p className="text-sm text-error">{t("admin.loadFailed.products")}</p>
  }

  if (products.length === 0) {
    return <EmptyState icon={PackageX} title={t("admin.products.empty")} />
  }

  async function handleToggleActive(id: string, next: boolean) {
    const result = await setProductActive(id, next)
    if (!result.success) toast.error(result.error)
    reload()
  }

  async function handleToggleFeatured(id: string, next: boolean) {
    const result = await setProductFeatured(id, next)
    if (!result.success) toast.error(result.error)
    reload()
  }

  async function handleDelete(id: string, name: string) {
    const result = await deleteProduct(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(t("admin.products.deleted", { name }))
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/products/new">{t("admin.products.add")}</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.products.columns.product")}</TableHead>
            <TableHead>{t("admin.products.columns.sku")}</TableHead>
            <TableHead>{t("admin.products.columns.category")}</TableHead>
            <TableHead>{t("admin.products.columns.price")}</TableHead>
            <TableHead>{t("admin.products.columns.stock")}</TableHead>
            <TableHead>{t("admin.products.columns.featured")}</TableHead>
            <TableHead>{t("admin.products.columns.active")}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const category = categories.find((c) => c.id === product.category_id)
            const productName = nameOf(product, t.locale)
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="size-10 shrink-0">
                      <ImagePlaceholder
                        seed={product.id}
                        icon={getCategoryIcon(category?.slug ?? "")}
                        label={productName}
                        imageUrl={product.image_url}
                        sizes="40px"
                      />
                    </div>
                    <span className="max-w-40 truncate font-medium">{productName}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{product.sku}</TableCell>
                <TableCell className="whitespace-nowrap">{category ? nameOf(category, t.locale) : "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPrice(product.price, t)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Switch
                    checked={product.is_featured}
                    onCheckedChange={(checked) => handleToggleFeatured(product.id, checked)}
                    aria-label={t("admin.products.toggleFeatured")}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.is_active}
                    onCheckedChange={(checked) => handleToggleActive(product.id, checked)}
                    aria-label={t("admin.products.toggleActive")}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={t("admin.products.edit")} asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("admin.products.delete")}
                      onClick={() => handleDelete(product.id, productName)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export { AdminProductsContent }
