// Open-redirect guard for a `?redirect=` query param: only accept a same-site
// path. Anyone can put anything in that parameter, so a link like
// /login?redirect=<something> must never be able to send a shopper (after they
// sign in) to another site.
//
// Browsers normalise URLs before following them: a backslash counts as a
// slash, and tabs and line breaks are dropped. So "/\evil.example" and
// "/<tab>/evil.example" both become "//evil.example" — a different site —
// and are refused here along with the obvious forms.
const UNSAFE_CHARACTERS = /[\\\u0000-\u001f\u007f]/

export function getSafeRedirect(
  value: string | string[] | undefined,
  fallback: string
): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return fallback
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return fallback
  if (UNSAFE_CHARACTERS.test(raw)) return fallback
  return raw
}
