import { ImageResponse } from "next/og"

import { BRAND_NAME } from "@/lib/brand"

// The picture shown when a page without its own image (the home page, a
// category with no photo, ...) is shared. The store name only, no sentence:
// the same image serves English and Amharic pages, and the image renderer has
// no Ethiopic font, so text in it would be Latin-only anyway.
export const alt = BRAND_NAME
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 44,
          background: "#092A25",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: 168,
            height: 168,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 18,
            paddingLeft: 44,
            background: "#123C35",
            borderRadius: 44,
          }}
        >
          <div style={{ width: 82, height: 16, borderRadius: 8, background: "#C9A15B" }} />
          <div style={{ width: 52, height: 16, borderRadius: 8, background: "#C9A15B" }} />
          <div style={{ width: 82, height: 16, borderRadius: 8, background: "#C9A15B" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: 10, textTransform: "uppercase" }}>
            {BRAND_NAME}
          </div>
          <div style={{ width: 140, height: 6, marginTop: 26, background: "#C9A15B", borderRadius: 3 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
