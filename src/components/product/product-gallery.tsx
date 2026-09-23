"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { cn } from "cn"

import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const VIEWS = 4

// Takes categorySlug (a plain string) rather than the resolved icon
// component: a Server Component parent can't pass a raw component
// reference as a prop into a Client Component (React can't serialize a
// function across that boundary) — resolving it here instead works because
// category-icons.ts is plain, un-"use client" data safely importable from
// either side.
function ProductGallery({
  productId,
  productName,
  categorySlug,
  imageUrl,
}: {
  productId: string
  productName: string
  categorySlug: string
  // The product's uploaded primary image (a plain string, so it can cross
  // the server/client boundary). Shown as the first view; the synthesized
  // placeholder views after it stay as they were.
  imageUrl?: string | null
}) {
  const Icon = getCategoryIcon(categorySlug)
  // A product has ONE real image (its primary product_images row), so the
  // first view uses it and the remaining "views" are synthesized by seeding
  // the same deterministic ImagePlaceholder differently per slot. A real
  // image that fails to load simply leaves the placeholder showing beneath
  // it (see ImagePlaceholder), so there's no broken-image state to guard.
  const seeds = useMemo(
    () => Array.from({ length: VIEWS }, (_, i) => `${productId}-${i}`),
    [productId]
  )
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  const scrollToIndex = (i: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" })
  }

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth))
  }, [])

  return (
    <div className="space-y-3">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-image [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {seeds.map((seed, i) => (
          <button
            key={seed}
            type="button"
            onClick={() => setZoomOpen(true)}
            className="w-full shrink-0 snap-center cursor-zoom-in"
            aria-label={`Enlarge image ${i + 1} of ${VIEWS} for ${productName}`}
          >
            <ImagePlaceholder
              seed={seed}
              icon={Icon}
              label={`${productName} — view ${i + 1}`}
              imageUrl={i === 0 ? imageUrl : null}
            />
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 lg:hidden">
        {seeds.map((seed, i) => (
          <span
            key={seed}
            className={cn("size-1.5 rounded-full", i === activeIndex ? "bg-burgundy" : "bg-border")}
          />
        ))}
      </div>

      <div className="hidden gap-2 lg:flex">
        {seeds.map((seed, i) => (
          <button
            key={seed}
            type="button"
            aria-current={i === activeIndex}
            onClick={() => scrollToIndex(i)}
            className={cn(
              "w-20 shrink-0 overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-background transition",
              i === activeIndex ? "ring-burgundy" : "ring-transparent"
            )}
          >
            <ImagePlaceholder seed={seed} icon={Icon} label={`View ${i + 1}`} imageUrl={i === 0 ? imageUrl : null} />
          </button>
        ))}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="sm:max-w-lg">
          <ImagePlaceholder
            seed={seeds[activeIndex]}
            icon={Icon}
            label={productName}
            imageUrl={activeIndex === 0 ? imageUrl : null}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ProductGallery }
