import { checkEnvironment } from "@/lib/env-check"

// Runs once when the server starts (not during `next build`, which may
// legitimately run without secrets, e.g. in CI). A configuration mistake is
// reported here, in words, before the first visitor; in production the server
// refuses to start on a real error rather than failing on every page.
export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return
  if (process.env.NEXT_RUNTIME === "edge") return // the checks use Node APIs; nothing here runs on the edge

  const production = process.env.NODE_ENV === "production"
  const { errors, warnings } = checkEnvironment(process.env, { production })

  for (const warning of warnings) console.warn(`[config] ${warning}`)
  for (const error of errors) console.error(`[config] ${error}`)

  if (production && errors.length > 0) {
    throw new Error(`Configuration is not safe or complete (${errors.length} problem${errors.length === 1 ? "" : "s"}); see the [config] lines above.`) // i18n-ignore: developer-facing
  }
}
