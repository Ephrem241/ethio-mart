import { describe, expect, it } from "vitest"

import { am } from "@/locales/am"
import { en } from "@/locales/en"

// TypeScript already forces the Amharic dictionary to have the English one's
// shape. These tests check what types can't: that no message is empty, and that
// each message keeps the same {placeholders} in both languages (a dropped
// {count} would put a literal "{count}" or a missing number on screen).

type Tree = { [key: string]: string | Tree }

function leaves(tree: Tree, path = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [[`${path}${key}`, value] as [string, string]] : leaves(value, `${path}${key}.`)
  )
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

const enLeaves = leaves(en as unknown as Tree)
const amMap = new Map(leaves(am as unknown as Tree))

describe("dictionaries", () => {
  it("has a reasonable number of messages (guards against loading the wrong file)", () => {
    expect(enLeaves.length).toBeGreaterThan(400)
  })

  it("has exactly the same message keys in English and Amharic", () => {
    expect([...amMap.keys()].sort()).toEqual(enLeaves.map(([key]) => key).sort())
  })

  it("has no empty message in either language", () => {
    const empty = [...enLeaves, ...amMap].filter(([, text]) => text.trim() === "").map(([key]) => key)
    expect(empty).toEqual([])
  })

  it("keeps the same {placeholders} in every Amharic message as in its English original", () => {
    const mismatched = enLeaves
      .filter(([key, text]) => JSON.stringify(placeholders(text)) !== JSON.stringify(placeholders(amMap.get(key) ?? "")))
      .map(([key, text]) => `${key}: en ${JSON.stringify(placeholders(text))} vs am ${JSON.stringify(placeholders(amMap.get(key) ?? ""))}`)
    expect(mismatched).toEqual([])
  })

  it("writes Amharic messages in Ethiopic script (a message left in English would be a translation gap)", () => {
    // Brand names, units and codes may stay Latin, so only flag messages with no Ethiopic letter at
    // all AND some real English words in them.
    const ETHIOPIC = /[ሀ-፿]/
    const suspicious = [...amMap]
      .filter(([, text]) => !ETHIOPIC.test(text) && /[A-Za-z]{4,}/.test(text.replace(/\{\w+\}/g, "")))
      .map(([key, text]) => `${key}: ${text}`)
    expect(suspicious).toEqual([])
  })
})

describe("plural messages", () => {
  const pluralPaths = enLeaves.map(([key]) => key).filter((key) => key.endsWith(".one"))

  it("come as a matching one/other pair", () => {
    expect(pluralPaths.length).toBeGreaterThanOrEqual(3)
    for (const oneKey of pluralPaths) {
      const otherKey = oneKey.replace(/\.one$/, ".other")
      expect(enLeaves.some(([key]) => key === otherKey), `${otherKey} exists in English`).toBe(true)
      expect(amMap.has(oneKey), `${oneKey} exists in Amharic`).toBe(true)
      expect(amMap.has(otherKey), `${otherKey} exists in Amharic`).toBe(true)
    }
  })

  it("mention {count} in both forms, in both languages", () => {
    for (const oneKey of pluralPaths) {
      for (const key of [oneKey, oneKey.replace(/\.one$/, ".other")]) {
        const enText = enLeaves.find(([k]) => k === key)![1]
        // A singular message may say "one item" in words, so only require the placeholder to agree.
        expect(placeholders(amMap.get(key)!)).toEqual(placeholders(enText))
      }
    }
  })
})
