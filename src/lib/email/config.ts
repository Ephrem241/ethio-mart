// The email settings, read from the server's environment (never NEXT_PUBLIC_:
// the Resend API key can send mail as the shop). With any of them missing, the
// store simply doesn't send: emails stay queued in the database until it is
// configured.

export interface EmailConfig {
  resendApiKey: string
  from: string
  shopEmail: string
  dispatchSecret: string
}

export const EMAIL_ENV_VARS = ["RESEND_API_KEY", "EMAIL_FROM", "SHOP_NOTIFY_EMAIL", "EMAIL_DISPATCH_SECRET"] as const

type Env = Record<string, string | undefined>

export function readEmailConfig(env: Env = process.env): { config: EmailConfig | null; missing: string[] } {
  const value = (name: string) => env[name]?.trim() ?? ""
  const missing: string[] = EMAIL_ENV_VARS.filter((name) => !value(name))
  // Resend API keys look like re_…; anything else is a pasted SMTP password, a
  // key from another service, or a typo.
  if (value("RESEND_API_KEY") && !value("RESEND_API_KEY").startsWith("re_")) missing.push("RESEND_API_KEY (a Resend key starts with re_)")
  if (value("EMAIL_DISPATCH_SECRET") && value("EMAIL_DISPATCH_SECRET").length < 32) missing.push("EMAIL_DISPATCH_SECRET (needs 32+ characters)")
  if (missing.length) return { config: null, missing }

  return {
    config: {
      resendApiKey: value("RESEND_API_KEY"),
      from: value("EMAIL_FROM"),
      shopEmail: value("SHOP_NOTIFY_EMAIL"),
      dispatchSecret: value("EMAIL_DISPATCH_SECRET"),
    },
    missing: [],
  }
}
