import { Star } from "lucide-react"
import { cn } from "cn"

import type { Translator } from "@/lib/i18n/translator"

// Server-renderable (takes the translator as a prop) — see Price. Gold stars
// are decorative: the accessible name is the "Rated 4.6 out of 5" label.
// There is no review COUNT shown because none is stored yet — `rating` is a
// single figure on the product, and a made-up "(124)" would be a lie.
function Rating({ value, t, className }: { value: number; t: Translator; className?: string }) {
  const filled = Math.round(value)

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="img"
      aria-label={t("product.rated", { value })}
    >
      <div className="flex gap-px" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("size-3.5", i < filled ? "fill-gold text-gold" : "fill-none text-border")}
          />
        ))}
      </div>
      <span aria-hidden className="text-xs font-medium text-muted-text">
        {value.toFixed(1)}
      </span>
    </div>
  )
}

export { Rating }
