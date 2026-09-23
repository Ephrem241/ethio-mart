import { cn } from "cn"
import { formatPrice } from "@/lib/currency"

function Price({
  amount,
  variant = "current",
  className,
}: {
  amount: number
  variant?: "current" | "compare"
  className?: string
}) {
  if (variant === "compare") {
    return (
      <span className={cn("text-sm text-muted-text line-through", className)}>
        {formatPrice(amount)}
      </span>
    )
  }

  return (
    <span className={cn("font-semibold text-burgundy", className)}>
      {formatPrice(amount)}
    </span>
  )
}

export { Price }
