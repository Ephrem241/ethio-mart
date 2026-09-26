import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

// The design-system reference page is a developer tool, not part of the shop:
// it exists only while developing. In a production build (including previews)
// the address is an ordinary 404, so it is not part of the public site.
// (It is also never indexed and disallowed in robots.txt.)
export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
}

export default function StyleGuideLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound()
  return children
}
