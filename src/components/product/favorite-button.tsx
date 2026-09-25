"use client"

import { Heart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { useFavoritesStore } from "@/lib/store/favorites"
import { Button } from "@/components/ui/button"

// A white round button that sits on top of a photo (card corner) or beside the
// purchase buttons (product page). Filled red when saved, like every shop's
// heart. The state is never colour alone: the accessible name says what the
// button will do ("Add to" / "Remove from favorites"), and every change is
// announced by a toast. (No aria-pressed on top of a label that changes with
// the state: a screen reader would read "Remove from favorites, pressed".)
function FavoriteButton({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const t = useT()
  const isFavorited = useFavoritesStore((s) => s.ids.includes(productId))
  const toggle = useFavoritesStore((s) => s.toggle)

  function handleToggle() {
    toggle(productId)
    toast.success(isFavorited ? t("product.favorites.removed") : t("product.favorites.added"))
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      onClick={handleToggle}
      aria-label={isFavorited ? t("product.favorites.remove") : t("product.favorites.add")}
      className={cn(
        "size-9 rounded-full bg-white/95 text-charcoal shadow-soft hover:bg-white hover:text-error",
        className
      )}
    >
      <Heart className={cn("size-[18px]", isFavorited && "fill-error text-error")} />
    </Button>
  )
}

export { FavoriteButton }
