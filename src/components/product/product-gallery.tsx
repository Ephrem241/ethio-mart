"use client"

import { useCallback, useRef, useState } from "react"
import { ZoomIn } from "lucide-react"
import { cn } from "cn"

import { useT } from "@/lib/i18n/provider"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { getCategoryIcon } from "@/components/product/category-icons"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Takes categorySlug (a plain string) rather than the resolved icon
// component: a Server Component parent can't pass a raw component
// reference as a prop into a Client Component (React can't serialize a
// function across that boundary) — resolving it here instead works because
// category-icons.ts is plain, un-"use client" data safely importable from
// either side.
//
// One view per REAL photo of the product: a product with a single photo shows
// just that (no thumbnails, no dots), a product with several gets a swipeable
// track on phones and clickable thumbnails on desktop. A product with no photo
// yet shows the single gradient placeholder. Nothing is invented — the extra
// "views" this gallery used to synthesize would sit beside a real photograph
// as empty tiles.
function ProductGallery({
  productId,
  productName,
  categorySlug,
  imageUrls,
}: {
  productId: string
  productName: string
  categorySlug: string
  // The product's photos, main one first (plain strings, so they can cross the
  // server/client boundary).
  imageUrls: string[]
}) {
  const t = useT()
  const Icon = getCategoryIcon(categorySlug)
  const views: (string | null)[] = imageUrls.length > 0 ? imageUrls : [null]
  const many = views.length > 1

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
      <div className="relative overflow-hidden rounded-card border border-border/70 bg-card shadow-soft">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {views.map((url, i) => (
            <button
              key={`${productId}-${i}`}
              type="button"
              onClick={() => setZoomOpen(true)}
              className="w-full shrink-0 snap-center cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              aria-label={t("product.gallery.enlarge", { index: i + 1, total: views.length, name: productName })}
            >
              <ImagePlaceholder
                seed={`${productId}-${i}`}
                icon={Icon}
                label={t("product.gallery.view", { name: productName, index: i + 1 })}
                imageUrl={url}
                // The photo the product page opens with: half the width on desktop,
                // full width on a phone. It is the largest thing on screen (LCP).
                sizes="(min-width: 1024px) 50vw, 100vw"
                eager={i === 0}
                className="rounded-none"
              />
            </button>
          ))}
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-soft"
        >
          <ZoomIn className="size-[18px]" />
        </span>
      </div>

      {many && (
        <div className="flex justify-center gap-1.5 lg:hidden">
          {views.map((_, i) => (
            <span
              key={`${productId}-dot-${i}`}
              className={cn("size-1.5 rounded-full", i === activeIndex ? "bg-forest" : "bg-border")}
            />
          ))}
        </div>
      )}

      {many && (
        <div className="hidden gap-2 lg:flex">
          {views.map((url, i) => (
            <button
              key={`${productId}-thumb-${i}`}
              type="button"
              aria-current={i === activeIndex}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "w-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-background transition",
                i === activeIndex ? "ring-forest" : "ring-transparent hover:ring-border"
              )}
            >
              <ImagePlaceholder
                seed={`${productId}-${i}`}
                icon={Icon}
                label={t("product.gallery.thumb", { index: i + 1 })}
                imageUrl={url}
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="sm:max-w-lg">
          <ImagePlaceholder
            seed={`${productId}-${activeIndex}`}
            icon={Icon}
            label={productName}
            imageUrl={views[activeIndex] ?? null}
            sizes="(min-width: 640px) 512px, calc(100vw - 2rem)"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ProductGallery }
