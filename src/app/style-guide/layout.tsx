import type { Metadata } from "next"
import type { ReactNode } from "react"

// The design-system reference page is a developer tool, not part of the shop:
// never indexed (it is also disallowed in robots.txt).
export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
}

export default function StyleGuideLayout({ children }: { children: ReactNode }) {
  return children
}
