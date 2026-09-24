import { ImageResponse } from "next/og"

// The browser-tab icon: the store's "E" mark (three gold bars on a forest tile),
// the same shape as the logo in the header. Generated at build time.
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 3,
          paddingLeft: 8,
          background: "#123C35",
          borderRadius: 9,
        }}
      >
        <div style={{ width: 16, height: 3, borderRadius: 2, background: "#C9A15B" }} />
        <div style={{ width: 10, height: 3, borderRadius: 2, background: "#C9A15B" }} />
        <div style={{ width: 16, height: 3, borderRadius: 2, background: "#C9A15B" }} />
      </div>
    ),
    { ...size }
  )
}
