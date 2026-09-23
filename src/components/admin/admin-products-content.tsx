"use client"

import Link from "next/link"
import { toast } from "sonner"
import { PackageX, Pencil, Trash2 } from "lucide-react"

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
  const { data: products, loading: productsLoading, reload } = useAdminProducts()
  const { data: categories, loading: categoriesLoading } = useAdminCategories()

  if (productsLoading || categoriesLoading) return null

  if (!products || !categories) {
    return <p className="text-sm text-error">We couldn&apos;t load products. Please refresh the page.</p>
  }

  if (products.length === 0) {
    return <EmptyState icon={PackageX} title="No products yet." />
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
    toast.success(`${name} deleted.`)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Active</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const category = categories.find((c) => c.id === product.category_id)
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="size-10 shrink-0">
                      <ImagePlaceholder
                        seed={product.id}
                        icon={getCategoryIcon(category?.slug ?? "")}
                        label={product.name_en}
                        imageUrl={product.image_url}
                      />
                    </div>
                    <span className="max-w-40 truncate font-medium">{product.name_en}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{product.sku}</TableCell>
                <TableCell className="whitespace-nowrap">{category?.name_en ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPrice(product.price)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Switch
                    checked={product.is_featured}
                    onCheckedChange={(checked) => handleToggleFeatured(product.id, checked)}
                    aria-label="Toggle featured"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.is_active}
                    onCheckedChange={(checked) => handleToggleActive(product.id, checked)}
                    aria-label="Toggle active"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Edit product" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete product"
                      onClick={() => handleDelete(product.id, product.name_en)}
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
