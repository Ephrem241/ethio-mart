"use client"

import { Heart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { useFavoritesStore } from "@/lib/store/favorites"
import { Button } from "@/components/ui/button"

function FavoriteButton({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const isFavorited = useFavoritesStore((s) => s.ids.includes(productId))
  const toggle = useFavoritesStore((s) => s.toggle)

  function handleToggle() {
    toggle(productId)
    toast.success(isFavorited ? "Removed from favorites." : "Added to favorites.")
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      onClick={handleToggle}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      className={cn("rounded-full shadow-sm", className)}
    >
      <Heart className={cn("size-4", isFavorited && "fill-burgundy text-burgundy")} />
    </Button>
  )
}

export { FavoriteButton }
