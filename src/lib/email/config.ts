// The email settings, read from the server's environment (never NEXT_PUBLIC_:
// they include the SMTP password). With any of them missing, the store simply
// doesn't send: emails stay queued in the database until it is configured.

export interface EmailConfig {
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string }
  from: string
  shopEmail: string
  dispatchSecret: string
}

export const EMAIL_ENV_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "SHOP_NOTIFY_EMAIL",
  "EMAIL_DISPATCH_SECRET",
] as const

type Env = Record<string, string | undefined>

export function readEmailConfig(env: Env = process.env): { config: EmailConfig | null; missing: string[] } {
  const value = (name: string) => env[name]?.trim() ?? ""
  const missing: string[] = EMAIL_ENV_VARS.filter((name) => !value(name))
  const port = Number(value("SMTP_PORT"))
  if (value("SMTP_PORT") && (!Number.isInteger(port) || port <= 0 || port > 65535)) missing.push("SMTP_PORT (not a port number)")
  if (value("EMAIL_DISPATCH_SECRET") && value("EMAIL_DISPATCH_SECRET").length < 32) missing.push("EMAIL_DISPATCH_SECRET (needs 32+ characters)")
  if (missing.length) return { config: null, missing }

  return {
    config: {
      // 465 = TLS from the start; 587 (Brevo's default) = STARTTLS, upgraded by nodemailer.
      smtp: { host: value("SMTP_HOST"), port, secure: port === 465, user: value("SMTP_USER"), pass: value("SMTP_PASS") },
      from: value("EMAIL_FROM"),
      shopEmail: value("SHOP_NOTIFY_EMAIL"),
      dispatchSecret: value("EMAIL_DISPATCH_SECRET"),
    },
    missing: [],
  }
}
