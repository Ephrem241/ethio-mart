import Link from "next/link"
import { cn } from "cn"

import { BRAND_NAME } from "@/lib/brand"
import { BRAND_COLORS, BRAND_MARK, BRAND_MARK_VIEWBOX } from "@/lib/brand-mark"

// The mark (a gold shopping bag with an "E" on it, see brand-mark.ts) beside a
// stacked wordmark: the first word large in the display serif, the rest small
// and widely spaced between two thin rules — "EVAEL / — STORE —".
//
// `variant="light"` is for dark surfaces (the footer): the handle turns gold
// so it doesn't vanish into the background, and the wordmark turns white.
// On light surfaces the small line uses gold-deep, not gold: plain gold on
// ivory is too faint to read at that size.
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
        "group inline-flex shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-lg:min-h-11 sm:gap-2.5",
        className
      )}
    >
      <svg
        viewBox={BRAND_MARK_VIEWBOX}
        aria-hidden
        className="h-8 w-auto shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-10 lg:h-11"
      >
        <path
          d={BRAND_MARK.handle}
          fill="none"
          strokeWidth={BRAND_MARK.handleWidth}
          strokeLinecap="round"
          className={light ? "stroke-gold" : "stroke-forest"}
        />
        <path d={BRAND_MARK.body} fill={BRAND_COLORS.gold} />
        <path d={BRAND_MARK.rim} fill={BRAND_COLORS.goldRim} />
        <path
          d={BRAND_MARK.letter}
          fill="none"
          strokeWidth={BRAND_MARK.letterWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={light ? "stroke-forest-dark" : "stroke-forest"}
        />
      </svg>
      <span
        aria-hidden
        className="flex flex-col text-[17px] leading-none uppercase min-[380px]:text-[19px] sm:text-[22px] lg:text-[26px]"
      >
        <span className={cn("font-display font-bold tracking-[0.08em]", light ? "text-white" : "text-forest")}>
          {first}
        </span>
        {rest.length > 0 && (
          <span
            className={cn(
              "mt-[0.3em] flex items-center gap-[0.4em] text-[0.45em] font-semibold",
              light ? "text-gold" : "text-gold-deep"
            )}
          >
            <span className="h-px flex-1 bg-current" />
            {/* Letter-spacing also trails the last letter; the negative margin re-centres the word. */}
            <span className="-mr-[0.42em] tracking-[0.42em]">{rest.join(" ")}</span>
            <span className="h-px flex-1 bg-current" />
          </span>
        )}
      </span>
    </Link>
  )
}

export { Logo }
