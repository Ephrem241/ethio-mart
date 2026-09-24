"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { useCartStore } from "@/lib/store/cart"

export function useAddToCart() {
  const t = useT()
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)

  return function addToCart(productId: string, quantity = 1) {
    addItem(productId, quantity)
    toast.success(t("product.addedToCart"), {
      action: { label: t("product.viewCart"), onClick: () => router.push("/cart") },
    })
  }
}
