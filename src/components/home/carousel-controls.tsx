"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useT } from "@/lib/i18n/provider"
import { Button } from "@/components/ui/button"

// The previous/next arrows for a horizontally scrolling rail. The rail itself
// is a plain server-rendered element (found here by id), so the product cards
// inside it stay Server Components; only these two buttons need JavaScript.
// An arrow disables itself at its end. The rail is also scrollable by touch,
// trackpad and keyboard, so the arrows are a convenience, not the only way.
function CarouselControls({ targetId }: { targetId: string }) {
  const t = useT()
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const rail = document.getElementById(targetId)
    if (!rail) return
    setCanPrev(rail.scrollLeft > 4)
    setCanNext(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4)
  }, [targetId])

  useEffect(() => {
    const rail = document.getElementById(targetId)
    if (!rail) return
    rail.addEventListener("scroll", update, { passive: true })
    // A ResizeObserver reports the rail's size as soon as it starts observing,
    // which also sets the initial arrow state — no separate first call needed.
    const observer = new ResizeObserver(update)
    observer.observe(rail)
    return () => {
      rail.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [targetId, update])

  function page(direction: 1 | -1) {
    const rail = document.getElementById(targetId)
    rail?.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canPrev}
        onClick={() => page(-1)}
        aria-label={t("home.carousel.previous")}
        className="size-9 rounded-full border-border bg-card text-charcoal hover:bg-cream"
      >
        <ChevronLeft />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canNext}
        onClick={() => page(1)}
        aria-label={t("home.carousel.next")}
        className="size-9 rounded-full border-border bg-card text-charcoal hover:bg-cream"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

export { CarouselControls }
