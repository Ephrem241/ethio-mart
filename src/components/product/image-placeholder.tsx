import { type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { RemoteProductImage } from "@/components/product/remote-product-image"

// Fixed, on-brand gradients — no stock photos, no external image calls
// (spec Sections 11/53). Picked deterministically from the item's id so the
// same product/category always renders the same placeholder and server and
// client render identical markup (no hydration mismatch).
const GRADIENTS = [
  "bg-linear-to-br from-sand to-ivory",
  "bg-linear-to-br from-forest/15 via-sand/40 to-ivory",
  "bg-linear-to-br from-sand/70 via-ivory to-sand/30",
  "bg-linear-to-br from-forest-dark/10 via-sand/50 to-ivory",
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function ImagePlaceholder({
  seed,
  icon: Icon,
  label,
  imageUrl,
  sizes = "100vw",
  eager,
  aspectClassName = "aspect-square",
  className,
}: {
  seed: string
  icon: LucideIcon
  label: string
  /**
   * Admin-settable (Phase 11). No file storage exists yet (Supabase Storage
   * is Phase 12), so this is a plain URL rather than a real upload. When
   * set, a real image renders on top of the gradient fallback below; a
   * failed load just leaves the fallback visible, and an unset URL (every
   * seed product) behaves exactly as before.
   */
  imageUrl?: string | null
  /**
   * How wide this image is displayed, as an HTML `sizes` value — say it
   * truthfully (e.g. "96px" for a cart thumbnail) so a small resized copy is
   * downloaded instead of the full-size original.
   */
  sizes?: string
  /** Load immediately instead of lazily: for the image the page opens with. */
  eager?: boolean
  aspectClassName?: string
  className?: string
}) {
  const gradient = GRADIENTS[hashString(seed) % GRADIENTS.length]

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-image",
        aspectClassName,
        gradient,
        className
      )}
    >
      <Icon aria-hidden className="size-10 text-forest/40" />
      {imageUrl && <RemoteProductImage src={imageUrl} alt={label} sizes={sizes} eager={eager} />}
    </div>
  )
}

export { ImagePlaceholder }
