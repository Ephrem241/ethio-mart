import { ImageResponse } from "next/og"

import { BRAND_COLORS } from "@/lib/brand-mark"
import { BrandMarkImage } from "@/lib/brand-mark-image"

// The home-screen icon on iOS (also used as the organization logo in
// structured data): the bag mark, larger. iOS rounds the corners itself, so
// the tile is square.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.forest,
        }}
      >
        <BrandMarkImage height={118} />
      </div>
    ),
    { ...size }
  )
}
