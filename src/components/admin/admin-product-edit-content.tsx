"use client"

import { FormSkeleton } from "@/components/feedback/skeletons"
import Link from "next/link"
import { PackageX } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { useAdminProduct } from "@/lib/hooks/use-admin-data"
import { AdminProductForm } from "@/components/admin/admin-product-form"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

function AdminProductEditContent({ productId }: { productId: string }) {
  const t = useT()
  const { data: product, loading } = useAdminProduct(productId)

  if (loading) return <FormSkeleton fields={6} />

  if (!product) {
    return (
      <EmptyState
        titleAs="h1"
        icon={PackageX}
        title={t("admin.products.notFound")}
        action={
          <Button asChild>
            <Link href="/admin/products">{t("admin.products.backToProducts")}</Link>
          </Button>
        }
      />
    )
  }

  return <AdminProductForm product={product} />
}

export { AdminProductEditContent }
