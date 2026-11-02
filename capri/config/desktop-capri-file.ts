import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

// Capri: the main process owns capri.json for the GUI (the renderer is sandboxed). Same file and rules as the TUI
// (packages/tui/src/capri-config.ts) and the CLI (packages/core/src/capri.ts), so all three agree.

export const levels = ["none", "low", "medium", "max"] as const
export type Level = (typeof levels)[number]
export const isLevel = (value: unknown): value is Level => levels.includes(value as Level)

export const file = () =>
  path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "capri", "capri.json")

function raw() {
  try {
    return readFileSync(file(), "utf8")
  } catch {
    return undefined
  }
}

// capri.json is JSONC. Drops comments and trailing commas outside strings, then parses as JSON.
export function parseJsonc(text: string): unknown {
  let out = ""
  let string = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    if (string) {
      out += char
      if (char === "\\") out += text[++i] ?? ""
      else if (char === '"') string = false
      continue
    }
    if (char === '"') {
      string = true
      out += char
      continue
    }
    if (char === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++
      out += "\n"
      continue
    }
    if (char === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i + 2)
      if (i === -1) break
      i++
      continue
    }
    out += char
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"))
}

export function read(): Record<string, unknown> {
  const text = raw()
  let value: unknown = {}
  try {
    value = text ? parseJsonc(text) : {}
  } catch {
    value = {}
  }
  const settings: Record<string, unknown> =
    typeof value === "object" && value !== null && !Array.isArray(value) ? { ...value } : {}
  // CAPRI_GLITCH_CONTEXT fakes a full context window so the glitch can be tried without a long session.
  const context = Number(process.env.CAPRI_GLITCH_CONTEXT)
  if (process.env.CAPRI_GLITCH_CONTEXT && Number.isFinite(context)) settings.glitchContext = context
  // CAPRI_CYBERPSYCOSIS overrides the file for one launch, as in the CLI.
  if (isLevel(process.env.CAPRI_CYBERPSYCOSIS)) return { ...settings, cyberpsycosis: process.env.CAPRI_CYBERPSYCOSIS }
  return settings
}

// Rewrites only the "cyberpsycosis" value, so comments and the other options survive.
export function setCyberpsycosis(level: Level) {
  const text = raw()
  const entry = `"cyberpsycosis": "${level}"`
  const next =
    text === undefined || /^\s*\{\s*\}\s*$/.test(text)
      ? `{\n  ${entry}\n}\n`
      : /"cyberpsycosis"\s*:\s*"[^"]*"/.test(text)
        ? text.replace(/"cyberpsycosis"\s*:\s*"[^"]*"/, entry)
        : text.replace("{", `{\n  ${entry},`)
  mkdirSync(path.dirname(file()), { recursive: true })
  writeFileSync(file(), next)
}
