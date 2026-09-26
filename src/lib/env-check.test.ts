import { describe, expect, it } from "vitest"

import { checkEnvironment } from "@/lib/env-check"
import { JWT_PATTERN, SECRET_KEY_PATTERN, jwtRole } from "@/lib/jwt-role"

// Keys are built here, never real ones — and assembled at run time, so that no
// key-shaped text sits in the repository (`npm run check:secrets` flags it).
const opaqueSecret = ["sb", "secret", "abcdefgh12345678"].join("_")
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
const key = (role: string) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: "supabase", role })}.c2lnbmF0dXJlLXNpZ25hdHVyZQ`

const good = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: key("anon"),
  NEXT_PUBLIC_SITE_URL: "https://www.example.com",
}

describe("jwtRole", () => {
  it("reads the role a Supabase key acts as", () => {
    expect(jwtRole(key("anon"))).toBe("anon")
    expect(jwtRole(key("service_role"))).toBe("service_role")
    expect(jwtRole(`  ${key("anon")}\n`)).toBe("anon")
  })

  it.each(["", "not-a-token", "a.b.c", "a.b", `${b64({})}.${b64({ nope: 1 })}.sig`, `x.${b64({ role: 7 })}.y`])(
    "says nothing about something that is not a key with a role (%j)",
    (value) => {
      expect(jwtRole(value)).toBeNull()
    }
  )

  it("finds keys inside a block of text, for scanning built files", () => {
    const text = `var a="${key("anon")}";var b='${key("service_role")}';`
    expect(text.match(JWT_PATTERN)).toHaveLength(2)
    expect(`token ${opaqueSecret} here`.match(SECRET_KEY_PATTERN)).toEqual([opaqueSecret])
    expect(["sb", "publishable", "abcdefgh12345678"].join("_").match(SECRET_KEY_PATTERN)).toBeNull()
  })
})

describe("checkEnvironment", () => {
  it("is happy with a correct production setup", () => {
    expect(checkEnvironment(good, { production: true })).toEqual({ errors: [], warnings: [] })
  })

  it.each(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])("cannot work without %s", (name) => {
    for (const value of [undefined, "", "   "]) {
      const { errors } = checkEnvironment({ ...good, [name]: value }, { production: false })
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain(name)
    }
  })

  it("rejects a Supabase address that is not an address, or not https in production", () => {
    expect(checkEnvironment({ ...good, NEXT_PUBLIC_SUPABASE_URL: "supabase" }, { production: false }).errors[0]).toContain("not a valid address")
    expect(checkEnvironment({ ...good, NEXT_PUBLIC_SUPABASE_URL: "http://abcdefgh.supabase.co" }, { production: true }).errors[0]).toContain("https")
    expect(checkEnvironment({ ...good, NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321" }, { production: false }).errors).toEqual([])
  })

  it("catches a service-role key pasted where the public key belongs", () => {
    for (const secret of [key("service_role"), opaqueSecret]) {
      const { errors } = checkEnvironment({ ...good, NEXT_PUBLIC_SUPABASE_ANON_KEY: secret }, { production: false })
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain("SERVICE-ROLE")
    }
  })

  it("catches a secret published under a NEXT_PUBLIC_ name", () => {
    const byName = checkEnvironment({ ...good, NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "anything" }, { production: false })
    expect(byName.errors.some((e) => e.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"))).toBe(true)

    const secret = key("service_role")
    const byValue = checkEnvironment({ ...good, SUPABASE_SERVICE_ROLE_KEY: secret, NEXT_PUBLIC_DEBUG_TOKEN: secret }, { production: false })
    expect(byValue.errors.some((e) => e.includes("NEXT_PUBLIC_DEBUG_TOKEN"))).toBe(true)
  })

  it("does not mistake the ordinary public variables for a leak", () => {
    const env = { ...good, SUPABASE_SERVICE_ROLE_KEY: key("service_role") }
    expect(checkEnvironment(env, { production: false }).errors).toEqual([])
  })

  it("tells production to drop the service-role key from the hosting environment", () => {
    const env = { ...good, SUPABASE_SERVICE_ROLE_KEY: key("service_role") }
    expect(checkEnvironment(env, { production: true }).warnings.some((w) => w.includes("SUPABASE_SERVICE_ROLE_KEY"))).toBe(true)
    expect(checkEnvironment(env, { production: false }).warnings).toEqual([]) // needed locally by the scripts
  })

  describe("the site address", () => {
    const withoutSite = { ...good, NEXT_PUBLIC_SITE_URL: undefined }

    it("warns when it is missing or points at this computer, in production only", () => {
      expect(checkEnvironment(withoutSite, { production: true }).warnings.some((w) => w.includes("NEXT_PUBLIC_SITE_URL"))).toBe(true)
      expect(checkEnvironment({ ...good, NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }, { production: true }).warnings).toHaveLength(1)
      expect(checkEnvironment(withoutSite, { production: false }).warnings).toEqual([])
    })

    it("accepts the address Vercel provides when none is set", () => {
      const env = { ...withoutSite, VERCEL_PROJECT_PRODUCTION_URL: "shop.example.com" }
      expect(checkEnvironment(env, { production: true }).warnings).toEqual([])
    })
  })
})
