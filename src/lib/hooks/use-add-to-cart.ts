"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCartStore } from "@/lib/store/cart"

export function useAddToCart() {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)

  return function addToCart(productId: string, quantity = 1) {
    addItem(productId, quantity)
    toast.success("Added to your cart.", {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    })
  }
}
