import { ImageResponse } from "next/og"

// The home-screen icon on iOS (also used as the organization logo in
// structured data): the "E" mark, larger. iOS rounds the corners itself, so
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
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 17,
          paddingLeft: 48,
          background: "#123C35",
        }}
      >
        <div style={{ width: 84, height: 17, borderRadius: 9, background: "#C9A15B" }} />
        <div style={{ width: 54, height: 17, borderRadius: 9, background: "#C9A15B" }} />
        <div style={{ width: 84, height: 17, borderRadius: 9, background: "#C9A15B" }} />
      </div>
    ),
    { ...size }
  )
}
