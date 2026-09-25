// A product or category slug is lowercase letters and digits joined by single
// hyphens — the database enforces exactly this on the column, so anything else
// cannot exist. A visitor (or a scanner) can put anything in a /product/<slug>
// address, so it is checked before it is used: an invalid slug is a plain
// "not found", never a question sent to the database. (Asking it something like
// `' or 1=1--` gets the request blocked by Supabase's web firewall, and a
// malformed %-sequence is rejected as a bad request; either would otherwise
// turn into a server error page.)
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

const MAX_SLUG_LENGTH = 200

export function isValidSlug(value: string): boolean {
  return value.length <= MAX_SLUG_LENGTH && SLUG_RE.test(value)
}

// True when a request path contains a %-sequence that is not valid UTF-8
// (`/product/%FF`, `/category/%E0%A4%A`). Next.js cannot decode such a path,
// and in an app with no pages/ directory it answers with a bare-text 500
// instead of the 400 it means to send — so the proxy catches these first
// and shows the ordinary "not found" page.
export function hasMalformedEncoding(pathname: string): boolean {
  try {
    decodeURIComponent(pathname)
    return false
  } catch {
    return true
  }
}
