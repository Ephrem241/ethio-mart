import { cn } from "cn"

// The "-25%" pill. Solid red-on-white (not a tinted badge) so it stays legible
// on top of a photo.
function DiscountBadge({
  price,
  compareAtPrice,
  className,
}: {
  price: number
  compareAtPrice: number | null
  className?: string
}) {
  if (!compareAtPrice || compareAtPrice <= price) return null

  const percentOff = Math.round((1 - price / compareAtPrice) * 100)

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-lg bg-error px-2 text-xs font-semibold text-white",
        className
      )}
    >
      -{percentOff}%
    </span>
  )
}

export { DiscountBadge }
