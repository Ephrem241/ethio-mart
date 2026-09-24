import Link from "next/link"
import { cn } from "cn"

import { BRAND_NAME } from "@/lib/brand"

// A geometric "E" — three bars in a rounded square — beside a spaced-out
// wordmark. `variant="light"` is for dark surfaces (the footer): the mark
// flips to gold and the wordmark to white.
function Logo({
  className,
  variant = "default",
}: {
  className?: string
  variant?: "default" | "light"
}) {
  const light = variant === "light"
  const [first, ...rest] = BRAND_NAME.split(" ")

  return (
    <Link
      href="/"
      aria-label={BRAND_NAME}
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 min-[380px]:gap-2.5",
        className
      )}
    >
      <svg viewBox="0 0 32 32" aria-hidden className="size-7 shrink-0 min-[380px]:size-8 sm:size-9">
        <rect width="32" height="32" rx="9" className={light ? "fill-gold" : "fill-forest"} />
        <path
          d="M9.5 9.75h13M9.5 16h8.5M9.5 22.25h13"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          className={light ? "stroke-forest-dark" : "stroke-gold"}
        />
      </svg>
      <span
        aria-hidden
        className={cn(
          "text-[13px] leading-none tracking-[0.14em] uppercase min-[380px]:text-[15px] min-[380px]:tracking-[0.18em] sm:text-base",
          light ? "text-white" : "text-forest"
        )}
      >
        <span className="font-bold">{first}</span>
        {rest.length > 0 && <span className="ml-[0.4em] font-medium">{rest.join(" ")}</span>}
      </span>
    </Link>
  )
}

export { Logo }
