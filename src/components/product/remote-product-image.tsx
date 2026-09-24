"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "cn"

// Only files in this project's public Storage buckets can go through the image
// optimizer (see next.config.ts); anything else — e.g. an old image URL typed
// in by hand — is shown as-is rather than crashing the page.
const OPTIMIZABLE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`

// A tiny, isolated client leaf so ImagePlaceholder itself can stay
// directive-free (it's called directly from Server Components today, e.g.
// category/[slug]/page.tsx, passing a resolved icon component — making
// ImagePlaceholder itself "use client" would break that exact call site,
// the same class of bug Phase 5 hit with ProductGallery). Only plain,
// serializable props cross into this boundary, never a component reference
// or callback, so it's safe to render from either a Server or Client parent.
// Rendered absolutely positioned OVER ImagePlaceholder's existing
// gradient+icon fallback — on load failure this simply hides itself, letting
// the fallback underneath show through with no callback back to the parent
// required.
//
// `sizes` tells the browser how wide the image is actually displayed at each
// viewport width, so it fetches a matching resized copy (not the 1600px file);
// images are lazy by default, `eager` is for the one that is the first thing a
// page shows (the product photo).
function RemoteProductImage({
  src,
  alt,
  sizes,
  eager = false,
  className,
}: {
  src: string
  alt: string
  sizes: string
  eager?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={!src.startsWith(OPTIMIZABLE_PREFIX)}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  )
}

export { RemoteProductImage }
