// One-time seed script — run manually via `npm run seed:admin`, AFTER all
// migrations in supabase/migrations/ have been applied. Never run as part
// of the app/build. Creates the one real admin account this app ships
// with, since admin status must never be self-assignable through the
// public register form. Idempotent: safe to re-run.
import { randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAIL = "admin@ethiomart.com"
const ADMIN_FULL_NAME = "Ethio Mart Admin"

// Never hardcode the admin password in source. Set SEED_ADMIN_PASSWORD in
// .env to choose one; otherwise a random one is generated and printed once.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || randomBytes(15).toString("base64url")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  let userId: string | undefined
  let created = false

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle()

  if (existingProfile) {
    userId = existingProfile.id
    console.log("Admin auth user already exists, skipping creation.")
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_FULL_NAME },
    })

    if (error || !data.user) {
      throw new Error(`Failed to create admin auth user: ${error?.message}`)
    }
    userId = data.user.id
    created = true
    console.log("Created admin auth user.")
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId)

  if (updateError) {
    throw new Error(`Failed to promote admin profile: ${updateError.message}`)
  }

  // A BEFORE UPDATE trigger can silently rewrite the role without erroring,
  // so confirm the promotion actually stuck rather than trusting the update.
  const { data: promoted } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (promoted?.role !== "admin") {
    throw new Error(`Promotion did not take: profile role is "${promoted?.role}".`)
  }

  // Only reveal the password on the run that actually set it; on a re-run the
  // account already exists and ADMIN_PASSWORD was not applied to it.
  if (created) {
    console.log(`Admin account ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
    console.log("Save this password now — it is not stored anywhere and will not be shown again.")
  } else {
    console.log(`Admin account ready: ${ADMIN_EMAIL} (password unchanged).`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
