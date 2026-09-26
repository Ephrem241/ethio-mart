import { ImageResponse } from "next/og"

import { BRAND_NAME } from "@/lib/brand"
import { BRAND_COLORS } from "@/lib/brand-mark"
import { BrandMarkImage } from "@/lib/brand-mark-image"

// The picture shown when a page without its own image (the home page, a
// category with no photo, ...) is shared: the logo lockup, no sentence. The
// same image serves English and Amharic pages, and the image renderer has no
// Ethiopic font, so text in it would be Latin-only anyway. (The wordmark is in
// the renderer's own sans: it takes only ttf/otf/woff, and the display serif
// is self-hosted as woff2.)
export const alt = BRAND_NAME
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  const [first, ...rest] = BRAND_NAME.split(" ")
  const rule = { flexGrow: 1, height: 3, background: BRAND_COLORS.gold, borderRadius: 2 }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          background: BRAND_COLORS.forestDark,
          color: "#FFFFFF",
        }}
      >
        <BrandMarkImage height={220} letter={BRAND_COLORS.forestDark} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: 12, lineHeight: 1, textTransform: "uppercase" }}>
            {first}
          </div>
          {rest.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                marginTop: 28,
                color: BRAND_COLORS.gold,
                fontSize: 44,
                fontWeight: 600,
                letterSpacing: 18,
                textTransform: "uppercase",
              }}
            >
              <div style={rule} />
              {rest.join(" ")}
              <div style={rule} />
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
