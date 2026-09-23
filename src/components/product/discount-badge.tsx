import { Badge } from "@/components/ui/badge"

function DiscountBadge({
  price,
  compareAtPrice,
}: {
  price: number
  compareAtPrice: number | null
}) {
  if (!compareAtPrice || compareAtPrice <= price) return null

  const percentOff = Math.round((1 - price / compareAtPrice) * 100)

  return <Badge variant="destructive">-{percentOff}%</Badge>
}

export { DiscountBadge }
