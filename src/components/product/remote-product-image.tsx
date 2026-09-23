"use client"

import { useState } from "react"
import { cn } from "cn"

// A tiny, isolated client leaf so ImagePlaceholder itself can stay
// directive-free (it's called directly from Server Components today, e.g.
// category/[slug]/page.tsx, passing a resolved icon component — making
// ImagePlaceholder itself "use client" would break that exact call site,
// the same class of bug Phase 5 hit with ProductGallery). Only a plain,
// serializable `src` string crosses into this boundary, never a component
// reference or callback, so it's safe to render from either a Server or
// Client parent. Rendered absolutely positioned OVER ImagePlaceholder's
// existing gradient+icon fallback — on load failure this simply hides
// itself, letting the fallback underneath show through with no callback
// back to the parent required.
function RemoteProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    // Arbitrary admin-supplied URL, not a local/optimizable asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className={cn("object-cover", className)} />
  )
}

export { RemoteProductImage }
