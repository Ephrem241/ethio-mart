"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"

// The homepage's marketing banners (hero, special deals, lifestyle), combined
// into one swipeable full-bleed carousel — phones only; desktop keeps each
// banner as its own separate, stacked section (see app/page.tsx). Reuses the
// exact scroll-tracking approach the product gallery already uses
// (product-gallery.tsx): the active dot comes from scroll position itself,
// not separate state that could drift from what's actually on screen.
//
// The track breaks out to the full viewport width here, rather than relying
// on each banner's own breakout — `overflow-x-auto` would otherwise clip that
// to a single slide's width. Each slide is exactly one viewport wide, and all
// of them are as tall as the tallest (flex items stretch); the slides fill
// that height themselves (`h-full`, see mobile-home-slides.tsx and the hero's
// "slide" variant), so none is left with a blank band beneath it.
function MobileHomeCarousel({ slides }: { slides: ReactNode[] }) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth))
  }, [])

  if (slides.length <= 1) return <>{slides[0] ?? null}</>

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        role="region"
        aria-label={t("home.carousel.highlights")}
        tabIndex={0}
        className="flex snap-x snap-mandatory overflow-x-auto outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-screen shrink-0 snap-center">
            {slide}
          </div>
        ))}
      </div>
      {/* Decorative: every slide is a real, separately-headed section already
          reachable by scrolling (touch, trackpad or keyboard via the region
          above) — the dots are a convenience, not the only way to navigate. */}
      <div aria-hidden className="flex justify-center gap-1.5 py-3">
        {slides.map((_, i) => (
          <span
            key={i}
            className={cn("size-1.5 rounded-full transition-colors", i === activeIndex ? "bg-forest" : "bg-border")}
          />
        ))}
      </div>
    </div>
  )
}

export { MobileHomeCarousel }
