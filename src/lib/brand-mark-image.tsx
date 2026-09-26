import { BRAND_COLORS, BRAND_MARK, BRAND_MARK_RATIO, BRAND_MARK_VIEWBOX } from "@/lib/brand-mark"

// The bag mark as plain SVG with inline colours, for the generated images
// (next/og can't use Tailwind classes or CSS variables). The images all sit on
// forest, so the handle defaults to gold to stay visible.
function BrandMarkImage({
  height,
  handle = BRAND_COLORS.gold,
  letter = BRAND_COLORS.forest,
}: {
  height: number
  handle?: string
  letter?: string
}) {
  return (
    <svg width={Math.round(height * BRAND_MARK_RATIO)} height={height} viewBox={BRAND_MARK_VIEWBOX}>
      <path d={BRAND_MARK.handle} fill="none" stroke={handle} strokeWidth={BRAND_MARK.handleWidth} strokeLinecap="round" />
      <path d={BRAND_MARK.body} fill={BRAND_COLORS.gold} />
      <path d={BRAND_MARK.rim} fill={BRAND_COLORS.goldRim} />
      <path
        d={BRAND_MARK.letter}
        fill="none"
        stroke={letter}
        strokeWidth={BRAND_MARK.letterWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { BrandMarkImage }
