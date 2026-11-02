import { createSignal } from "solid-js"

// Capri settings for the GUI: the same capri.json the TUI reads (~/.config/capri/capri.json), delivered by the
// desktop main process through `connectCapri`. Without a bridge (web build) the TUI defaults apply.

export const levels = ["none", "low", "medium", "max"] as const
export type Level = (typeof levels)[number]

export type Settings = {
  cyberpsycosis: Level
  glitchProbability: number
  hide: { thinking: boolean; toolResults: boolean; skills: boolean }
  footer: { name: string; model: boolean }
  // CAPRI_GLITCH_CONTEXT (0 to 1), passed through by the main process: fakes the context use for the glitch rate.
  glitchContext?: number
}

export type Bridge = {
  read(): Promise<unknown>
  setCyberpsycosis(level: Level): Promise<unknown>
}

export const defaults: Settings = {
  cyberpsycosis: "none",
  glitchProbability: 1,
  hide: { thinking: true, toolResults: true, skills: true },
  footer: { name: "Capri", model: false },
}

export const isLevel = (value: unknown): value is Level => levels.includes(value as Level)

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback)

// Accepts the raw capri.json object (or what the main process sends) and fills in the defaults.
export function normalize(value: unknown): Settings {
  const raw = record(value)
  const hide = record(raw.hide)
  const footer = record(raw.footer)
  const probability = raw.glitchProbability
  const context = raw.glitchContext
  return {
    cyberpsycosis: isLevel(raw.cyberpsycosis) ? raw.cyberpsycosis : defaults.cyberpsycosis,
    glitchProbability:
      typeof probability === "number" && Number.isFinite(probability) ? Math.min(10, Math.max(0, probability)) : 1,
    hide: {
      thinking: flag(hide.thinking, defaults.hide.thinking),
      toolResults: flag(hide.toolResults, defaults.hide.toolResults),
      skills: flag(hide.skills, defaults.hide.skills),
    },
    footer: {
      name: typeof footer.name === "string" ? footer.name : defaults.footer.name,
      model: flag(footer.model, defaults.footer.model),
    },
    glitchContext:
      typeof context === "number" && Number.isFinite(context) ? Math.min(1, Math.max(0, context)) : undefined,
  }
}

const [settings, setSettings] = createSignal<Settings>(defaults)
const [bridge, setBridge] = createSignal<Bridge>()

export const capri = settings

// How full the focused session's context window is (0 to 1); the glitch rate grows with it, as in the TUI.
const [context, setContext] = createSignal(0)
export const contextRatio = () => settings().glitchContext ?? context()
export const setContextRatio = (ratio: number) => setContext(Math.min(1, Math.max(0, ratio)))

// True when the app can read and write capri.json (the desktop app).
export const writable = () => bridge() !== undefined

export async function refresh() {
  const current = bridge()
  if (!current) return settings()
  const next = normalize(await current.read().catch(() => undefined))
  setSettings(next)
  return next
}

export function connectCapri(next: Bridge) {
  setBridge(() => next)
  void refresh()
}

// The level lives in capri.json; the CLI re-reads it every turn, so the next reply already uses the new prompt.
export async function setCyberpsycosis(level: Level) {
  const current = bridge()
  if (!current) throw new Error("capri.json is only writable from the desktop app")
  await current.setCyberpsycosis(level)
  return refresh()
}

// Label for an agent in reply footers: the default `build` agent is Capri (footer.name), others keep their name.
export function agentLabel(agent: string | undefined) {
  if (!agent) return ""
  if (agent === "build") return settings().footer.name
  return agent[0]!.toUpperCase() + agent.slice(1)
}

const CIPHER = "░▒▓█▚▞▙▛▜▟"

// Same cipher as the TUI (packages/tui/src/routes/session/message-parts.tsx): whitespace is kept so the block keeps
// the shape of thought, every other character becomes a glyph picked by index, so a streamed prefix stays stable.
export function encrypt(text: string) {
  let out = ""
  for (let i = 0; i < text.length; i++) {
    out += /\s/.test(text[i]!) ? text[i] : CIPHER[(i * 7 + (i >> 3) * 3) % CIPHER.length]
  }
  return out
}
