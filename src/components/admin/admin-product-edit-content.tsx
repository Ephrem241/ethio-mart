"use client"

import Link from "next/link"
import { PackageX } from "lucide-react"

import { useAdminProduct } from "@/lib/hooks/use-admin-data"
import { AdminProductForm } from "@/components/admin/admin-product-form"
import { EmptyState } from "@/components/feedback/empty-state"
import { Button } from "@/components/ui/button"

function AdminProductEditContent({ productId }: { productId: string }) {
  const { data: product, loading } = useAdminProduct(productId)

  if (loading) return null

  if (!product) {
    return (
      <EmptyState
        icon={PackageX}
        title="Product not found."
        action={
          <Button asChild>
            <Link href="/admin/products">Back to products</Link>
          </Button>
        }
      />
    )
  }

  return <AdminProductForm product={product} />
}

export { AdminProductEditContent }
