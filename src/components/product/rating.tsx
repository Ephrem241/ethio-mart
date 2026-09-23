import { Star } from "lucide-react"
import { cn } from "cn"

function Rating({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value)

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`Rated ${value} out of 5`}
    >
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i < filled ? "fill-warning text-warning" : "fill-none text-border"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-text">{value.toFixed(1)}</span>
    </div>
  )
}

export { Rating }
