// Cheap open-redirect guard for a `?redirect=` query param: only accept a
// same-site path. Worth the two lines even in a demo auth system since the
// pattern is exactly what a real implementation needs too.
export function getSafeRedirect(
  value: string | string[] | undefined,
  fallback: string
): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return fallback
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return fallback
  return raw
}
