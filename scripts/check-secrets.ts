// Fails if a Supabase SECRET key can be found anywhere the public could get it
// (spec section 59, "No exposed Supabase service role key"):
//   1. the built site: client JavaScript and CSS (.next/static), prerendered
//      pages and server output (.next/server) and the public/ folder;
//   2. the source files tracked by git, and any tracked .env file.
//
// A key is recognised by what it IS, not by where it was found: Supabase's
// JWT keys carry their role in the payload ("anon" is meant to be public,
// "service_role" is not), the newer opaque secret keys start "sb_secret_", and
// the value of SUPABASE_SERVICE_ROLE_KEY from the environment is searched for
// literally. Nothing found is ever printed in full.
//
//   npm run build && npm run check:secrets

import { execFileSync } from "node:child_process"
import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"

import { JWT_PATTERN, SECRET_KEY_PATTERN, jwtRole } from "../src/lib/jwt-role"

const ROOT = process.cwd()
const MAX_BYTES = 8 * 1024 * 1024
const TEXT_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".css", ".html", ".rsc", ".json", ".txt", ".xml", ".svg", ".md", ".ts", ".tsx", ".mts", ".sql", ".yml", ".yaml", ".toml", ".env", ""])

interface Finding {
  file: string
  what: string
}

const findings: Finding[] = []
let scanned = 0
let publicKeysSeen = 0

const redact = (secret: string) => `${secret.slice(0, 6)}…(${secret.length} characters)`

async function scanFile(file: string, serviceKey: string | undefined) {
  const info = await stat(file).catch(() => null)
  if (!info?.isFile() || info.size > MAX_BYTES) return
  if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) return

  const text = await readFile(file, "utf8")
  scanned++
  const relative = path.relative(ROOT, file).replaceAll("\\", "/")

  for (const token of new Set(text.match(JWT_PATTERN) ?? [])) {
    const role = jwtRole(token)
    if (role === "service_role") findings.push({ file: relative, what: `a service-role key (${redact(token)})` })
    else if (role === "anon") publicKeysSeen++
  }
  for (const secret of new Set(text.match(SECRET_KEY_PATTERN) ?? [])) {
    findings.push({ file: relative, what: `a Supabase secret key (${redact(secret)})` })
  }
  if (serviceKey && text.includes(serviceKey)) {
    findings.push({ file: relative, what: "the value of SUPABASE_SERVICE_ROLE_KEY" })
  }
}

async function scanDirectory(directory: string, serviceKey: string | undefined) {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch(() => null)
  if (!entries) return false
  for (const entry of entries) {
    if (entry.isFile() && !entry.name.endsWith(".map")) await scanFile(path.join(entry.parentPath, entry.name), serviceKey)
  }
  return true
}

function trackedFiles(): string[] {
  try {
    return execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\0").filter(Boolean)
  } catch {
    return [] // not a git checkout (e.g. a source archive)
  }
}

async function main() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined

  // 1. The built site.
  const built: string[] = []
  for (const directory of [".next/static", ".next/server", "public"]) {
    if (await scanDirectory(path.join(ROOT, directory), serviceKey)) built.push(directory)
  }
  const hasBuild = built.some((directory) => directory.startsWith(".next"))
  if (!hasBuild) console.warn("Note: there is no build (.next) to scan. Run `npm run build` first to check what would be published.")

  // 2. What is committed.
  const tracked = trackedFiles()
  for (const file of tracked) {
    if (/(^|\/)package-lock\.json$/.test(file)) continue
    if (/(^|\/)\.env(\.|$)/.test(file) && !/\.example$/.test(file)) {
      findings.push({ file, what: "an environment file, which must never be committed" })
      continue
    }
    await scanFile(path.join(ROOT, file), serviceKey)
  }

  console.log(`Scanned ${scanned} files (${built.join(", ") || "no build output"}${tracked.length ? `, ${tracked.length} tracked source files` : ""}).`)
  console.log(`Public (anon) keys found: ${publicKeysSeen} — expected in the browser bundle, protected by row-level security.`)

  if (findings.length === 0) {
    console.log("No secret keys found.")
    return
  }
  console.error(`\n${findings.length} SECRET KEY EXPOSURE(S):`)
  for (const finding of findings) console.error(`  ${finding.file}\n      ${finding.what}`)
  console.error("\nRotate any key that was published (Supabase → Settings → API), then remove it from the place above.")
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 2
})
