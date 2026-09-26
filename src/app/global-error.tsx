"use client"

import { useEffect } from "react"

// The last line of defence: shown only when the site's own layout fails to
// render, so none of the normal providers, styles, fonts or dictionaries exist
// here (and importing the dictionaries would add them to every page's
// JavaScript). The page does not know the visitor's language, so it says the
// same thing in both, using the same wording as the dictionaries.
const MESSAGE = {
  en: { title: "Something went wrong. Please try again.", retry: "Try again", home: "Back to home" }, // i18n-ignore: fallback for a broken layout
  am: { title: "የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።", retry: "እንደገና ሞክር", home: "ወደ መነሻ ተመለስ" }, // i18n-ignore: fallback for a broken layout
}

// Same colours as the design tokens in globals.css (forest, ivory).
const FOREST = "#123C35"
const IVORY = "#FAF7F0"

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: IVORY,
          color: "#1B1B1B",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Noto Sans Ethiopic', 'Nyala', sans-serif",
        }}
      >
        <title>{MESSAGE.en.title}</title>
        <main style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, lineHeight: 1.3, margin: "0 0 12px" }}>{MESSAGE.en.title}</h1>
          <p lang="am" style={{ fontSize: 18, lineHeight: 1.5, margin: "0 0 28px" }}>
            {MESSAGE.am.title}
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              background: FOREST,
              color: "#FFFFFF",
              border: 0,
              borderRadius: 999,
              padding: "12px 28px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {MESSAGE.en.retry} · <span lang="am">{MESSAGE.am.retry}</span>
          </button>
          <p style={{ marginTop: 20 }}>
            {/* A plain link on purpose: the router (and the layout around it) may be what broke, and a full page load starts clean. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: FOREST, textDecoration: "underline" }}>
              {MESSAGE.en.home} · <span lang="am">{MESSAGE.am.home}</span>
            </a>
          </p>
        </main>
      </body>
    </html>
  )
}
