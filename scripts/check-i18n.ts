// Guard for "no hardcoded UI strings outside the translation system"
// (MVP.plan Phase 13). Run with `npm run check:i18n`; exits 1 when it finds
// any. It reads the TypeScript AST of everything under src/ and reports
// user-facing literals: JSX text, text-bearing JSX props, toast/confirm
// arguments, `label:`/`title:`/`error:`-style object properties, and strings
// in JSX expressions (`{busy ? "Saving..." : "Save"}`).
//
// It is a heuristic, not a proof — it cannot know that "Home" is meant for a
// human. When a flagged literal is NOT user-facing, mark the line (or the one
// above it) with `// i18n-ignore` and a reason.
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import ts from "typescript"

const ROOT = path.join(process.cwd(), "src")

// Dictionaries hold the strings by design; the seed data files are content
// (product names in both languages), not UI; /style-guide is a developer
// reference page that is never linked from the storefront.
const SKIP = [
  `${path.sep}locales${path.sep}`,
  `${path.sep}lib${path.sep}data${path.sep}`,
  `${path.sep}app${path.sep}style-guide${path.sep}`,
]

// JSX props that never carry user-visible text. Any OTHER prop given a
// string literal that contains letters is reported.
const NON_UI_ATTRS = new Set([
  "className", "href", "src", "type", "id", "name", "htmlFor", "variant", "size", "key", "ref", "role",
  "autoComplete", "inputMode", "target", "rel", "method", "action", "style", "viewBox", "d", "fill",
  "stroke", "strokeWidth", "strokeLinecap", "strokeLinejoin", "xmlns", "width", "height", "sizes",
  "loading", "decoding", "dir", "lang", "side", "align", "asChild", "tabIndex", "as", "value",
  "defaultValue", "accept", "enterKeyHint", "autoCapitalize", "orientation", "fetchPriority",
  "crossOrigin", "referrerPolicy", "cx", "cy", "r", "x", "y", "x1", "x2", "y1", "y2", "points",
  "transform", "slot", "sideOffset", "alignOffset", "data-slot", "data-state", "data-sidebar",
  "aria-hidden", "aria-live", "aria-current", "aria-expanded", "aria-controls", "aria-haspopup",
  "aria-pressed", "aria-orientation", "aria-labelledby", "aria-describedby", "aria-busy", "aria-atomic",
  "aria-invalid", "aria-checked", "aria-selected", "aria-modal", "aria-disabled", "aria-required",
  "aria-relevant", "aria-sort", "aria-valuenow", "aria-valuemin", "aria-valuemax", "colorScheme",
  "position", "richColors", "theme", "toastOptions", "closeButton", "expand", "visibleToasts", "icons",
  "iconName", "icon", "field", "hrefBase", "paramName", "namespace", "unoptimized", "priority", "fill",
  "mode", "layout", "layoutId", "initial", "animate", "exit", "transition", "whileHover", "whileTap",
  "reducedMotion", "features", "strict", "tone", "titleAs", "sort", "basePath", "aspectClassName", "labels", "bucket", "step", "min", "max", "pattern", "rows", "cols", "wrap", "spellCheck", "list", "form", "formAction",
  "formMethod", "scope", "kind", "srcSet", "media", "content", "property", "httpEquiv", "charSet", "sm", "md",
])

// Object-literal keys whose string values are shown to people.
const UI_KEYS = new Set([
  "label", "title", "description", "message", "error", "placeholder", "heading", "subtitle", "eyebrow",
  "text", "hint", "cta", "ctaLabel", "emptyLabel", "helperText", "caption", "tagline", "summary",
])

const ZOD_METHODS = new Set([
  "min", "max", "email", "regex", "refine", "superRefine", "length", "int", "positive", "nonnegative",
  "url", "uuid", "startsWith", "endsWith", "includes", "gte", "lte", "gt", "lt", "multipleOf", "nonempty",
])

const HAS_TEXT = /[A-Za-zሀ-፿]/

// A string like "nav.home" or "checkout.payment.codLabel" is a dictionary
// key (looked up later), not text a person will read.
const DICTIONARY_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9-]+)+$/

interface Finding {
  file: string
  line: number
  kind: string
  text: string
}
const findings: Finding[] = []

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    // Tests and their builders are not user interface: they hold plain English sample data.
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts") && !/\.test\.tsx?$/.test(entry) && !full.includes(`${path.sep}test${path.sep}`)) out.push(full)
  }
  return out
}

function unescapeEntities(text: string): string {
  return text
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
}

// The literal string leaves a JSX expression can evaluate to.
function stringLeaves(expr: ts.Expression): ts.Expression[] {
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr) || ts.isTemplateExpression(expr)) {
    return [expr]
  }
  if (ts.isParenthesizedExpression(expr)) return stringLeaves(expr.expression)
  if (ts.isConditionalExpression(expr)) return [...stringLeaves(expr.whenTrue), ...stringLeaves(expr.whenFalse)]
  if (ts.isBinaryExpression(expr)) {
    const op = expr.operatorToken.kind
    if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) {
      return [...stringLeaves(expr.left), ...stringLeaves(expr.right)]
    }
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) return stringLeaves(expr.right)
  }
  return []
}

function literalText(node: ts.Expression): string {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans.map((s) => "${…}" + s.literal.text).join("")
  }
  return ""
}

function scan(file: string) {
  const source = readFileSync(file, "utf8")
  const lines = source.split(/\r?\n/)
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const rel = path.relative(process.cwd(), file).replaceAll("\\", "/")

  const ignored = (line: number) => /i18n-ignore/.test(lines[line] ?? "") || /i18n-ignore/.test(lines[line - 1] ?? "")

  const report = (node: ts.Node, kind: string, text: string) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart()).line
    if (ignored(line)) return
    findings.push({ file: rel, line: line + 1, kind, text: text.replace(/\s+/g, " ").trim().slice(0, 90) })
  }

  const reportLeaves = (expr: ts.Expression, kind: string) => {
    for (const leaf of stringLeaves(expr)) {
      const text = literalText(leaf)
      if (HAS_TEXT.test(text) && !DICTIONARY_KEY.test(text)) report(leaf, kind, text)
    }
  }

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const text = unescapeEntities(node.getText())
      if (HAS_TEXT.test(text)) report(node, "jsx-text", text)
    } else if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
      reportLeaves(node.expression, "jsx-expression")
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText()
      if (!NON_UI_ATTRS.has(name) && !name.startsWith("data-") && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          const text = node.initializer.text
          if (HAS_TEXT.test(text) && !DICTIONARY_KEY.test(text)) report(node, `prop ${name}`, text)
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          reportLeaves(node.initializer.expression, `prop ${name}`)
        }
      }
    } else if (ts.isPropertyAssignment(node)) {
      const key = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : ""
      if (UI_KEYS.has(key)) reportLeaves(node.initializer, `key ${key}`)
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression
      const calleeName = ts.isPropertyAccessExpression(callee) ? callee.name.text : ts.isIdentifier(callee) ? callee.text : ""
      const owner = ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) ? callee.expression.text : ""
      if (owner === "toast" || ["confirm", "alert", "prompt"].includes(calleeName)) {
        if (node.arguments[0]) reportLeaves(node.arguments[0], `${owner || calleeName}()`)
      } else if (/^set\w*(Error|Message|Status)$/.test(calleeName)) {
        // react-hook-form's setError("field", { message }) has two arguments,
        // the first a field name; a state setter takes just the message.
        if (node.arguments.length === 1) reportLeaves(node.arguments[0], `${calleeName}()`)
      } else if (ZOD_METHODS.has(calleeName) && ts.isPropertyAccessExpression(callee)) {
        for (const arg of node.arguments) {
          if (ts.isStringLiteral(arg) && HAS_TEXT.test(arg.text) && /\s|^[A-Z]/.test(arg.text)) report(arg, "validation", arg.text)
        }
      }
    } else if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Error") {
      if (node.arguments?.[0]) reportLeaves(node.arguments[0], "new Error()")
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

for (const file of walk(ROOT)) {
  if (SKIP.some((s) => file.includes(s))) continue
  scan(file)
}

const byFile = new Map<string, Finding[]>()
for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f])

if (process.argv.includes("--summary")) {
  for (const [file, list] of [...byFile].sort((a, b) => b[1].length - a[1].length)) console.log(String(list.length).padStart(4), file)
} else {
  for (const [file, list] of byFile) {
    console.log(`\n${file}`)
    for (const f of list) console.log(`  ${String(f.line).padStart(4)}  ${f.kind.padEnd(16)} ${f.text}`)
  }
}
console.log(`\n${findings.length} hardcoded UI string(s) in ${byFile.size} file(s).`)
process.exit(findings.length ? 1 : 0)
