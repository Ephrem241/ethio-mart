import { jwtRole } from "@/lib/jwt-role"
import { EMAIL_ENV_VARS, readEmailConfig } from "@/lib/email/config"

// What the server needs to be configured with, checked when it starts (see
// instrumentation.ts) so a mistake shows up in the deployment log at once,
// in words, instead of as errors on every page.

type Env = Record<string, string | undefined>

export interface EnvReport {
  /** The site cannot work, or a secret is exposed. */
  errors: string[]
  /** It works, but something should be fixed before real customers arrive. */
  warnings: string[]
}

const isSet = (value: string | undefined): value is string => !!value && value.trim() !== ""

export function checkEnvironment(env: Env, { production }: { production: boolean }): EnvReport {
  const errors: string[] = []
  const warnings: string[] = []

  // --- Supabase: the two public values every page needs.
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!isSet(url)) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is not set (the Supabase project URL, https://<project>.supabase.co).")
  } else {
    try {
      const parsed = new URL(url)
      if (production && parsed.protocol !== "https:") {
        errors.push(`NEXT_PUBLIC_SUPABASE_URL must be an https address in production (it is ${parsed.protocol}//…).`)
      }
    } catch {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is not a valid address.")
    }
  }

  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!isSet(anonKey)) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set (the project's public/anon key).")
  } else if (jwtRole(anonKey) === "service_role" || anonKey.startsWith("sb_secret_")) {
    errors.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY holds a SERVICE-ROLE (secret) key. Every visitor's browser receives this value, and it bypasses all database security. Replace it with the anon/publishable key and rotate the secret key in Supabase now."
    )
  }

  // --- The secret key must never be published under a NEXT_PUBLIC_ name
  // (Next.js copies those into the JavaScript sent to browsers).
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith("NEXT_PUBLIC_") || !isSet(value)) continue // i18n-ignore: an environment variable name
    if (/SERVICE|SECRET|PRIVATE|PASS|SMTP|RESEND|API_KEY/i.test(name)) {
      errors.push(`${name} would be published to every browser: variables starting NEXT_PUBLIC_ must never hold a secret. Rename it (without the prefix).`)
    } else if (isSet(serviceKey) && value.trim() === serviceKey && name !== "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      errors.push(`${name} has the same value as SUPABASE_SERVICE_ROLE_KEY and would be published to every browser.`)
    }
  }

  // --- Things that work but should be right before launch.
  if (production) {
    if (isSet(serviceKey)) {
      warnings.push(
        "SUPABASE_SERVICE_ROLE_KEY is set on the server. The site never uses it (only the seed scripts and the test suite do): remove it from the hosting environment so that a bug or a leaked log can never expose it."
      )
    }
    const site = env.NEXT_PUBLIC_SITE_URL?.trim() || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
    if (!site) {
      warnings.push("NEXT_PUBLIC_SITE_URL is not set: canonical links, the sitemap and share previews will point at http://localhost:3000.")
    } else if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(site)) {
      warnings.push(`NEXT_PUBLIC_SITE_URL is ${site}: canonical links, the sitemap and share previews will point at a local address.`)
    }

    // Email (README "Email"): all of it or none of it. Without it the store
    // still works, but order emails and contact messages only queue up.
    const email = readEmailConfig(env)
    const anyEmail = EMAIL_ENV_VARS.some((name) => isSet(env[name]))
    if (!email.config && anyEmail) {
      warnings.push(`Email is only partly configured, so nothing is sent (missing or invalid: ${email.missing.join(", ")}).`)
    } else if (!email.config) {
      warnings.push("Email is not configured (RESEND_API_KEY and the rest, see README \"Email\"): order emails and contact-form messages are queued but not sent.")
    }
  }

  return { errors, warnings }
}
