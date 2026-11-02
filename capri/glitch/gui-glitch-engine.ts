// Capri: the TUI glitch engine (capri/glitch/glitch.ts) without OpenTUI, for the GUI overlay. Same rates and shapes,
// measured in "cells" so the GUI glitches look like the terminal's: blocks a few characters wide, one or two rows high.
import type { Level } from "@opencode/session-ui/capri"

// Capri's logo colors: green, white and magenta.
export const palette = ["#02F968", "#FFFFFF", "#FF3885"] as const

// Rectangles per second at a full context window; the real rate scales linearly with context use.
export const weight: Record<Level, number> = { none: 0, low: 1, medium: 3, max: 8 }

const FLOOR = 0.05
const SHIFT_SHARE = 0.25
const SHIFT_SECONDS = 0.5
const SHIFT_REROLL_SECONDS = 0.08

export const spawnRate = (level: Level, ratio: number, probability = 1) =>
  weight[level] * probability * (FLOOR + (1 - FLOOR) * Math.min(1, Math.max(0, ratio)))

export const shiftRate = (level: Level, ratio: number, probability = 1) =>
  spawnRate(level, ratio, probability) * SHIFT_SHARE

export type Rect = {
  id: number
  x: number
  y: number
  width: number
  height: number
  speed: number
  color: string
  life: number
  flicker: number
}

export type Shift = { id: number; row: number; offset: number; life: number; reroll: number }

export type State = { rects: Rect[]; shifts: Shift[]; next: number }

export const create = (): State => ({ rects: [], shifts: [], next: 0 })

export const active = (state: State) => state.rects.length > 0 || state.shifts.length > 0

const between = (random: () => number, min: number, max: number) => min + random() * (max - min)

const velocity = (random: () => number) => between(random, 4, 140) * (random() < 0.5 ? -1 : 1)

function spawn(state: State, size: { width: number; height: number }, random: () => number) {
  state.rects.push({
    id: state.next++,
    x: Math.floor(random() * size.width),
    y: Math.floor(random() * size.height),
    width: Math.floor(between(random, 3, Math.max(4, Math.min(24, size.width / 3)))),
    height: random() < 0.8 ? 1 : 2,
    speed: velocity(random),
    color: palette[Math.floor(random() * palette.length)]!,
    life: between(random, 0.04, 0.25),
    flicker: between(random, 0.1, 0.5),
  })
}

// Advances the effect by `dt` seconds; new glitches arrive as a Poisson process at the current rates.
export function step(
  state: State,
  dt: number,
  input: { level: Level; ratio: number; probability?: number; width: number; height: number },
  random: () => number = Math.random,
) {
  if (input.width <= 0 || input.height <= 0) return
  for (const rect of state.rects) {
    rect.x += rect.speed * dt
    rect.life -= dt
    if (random() < 12 * dt) rect.speed = velocity(random)
    else if (random() < 10 * dt) rect.speed = -rect.speed
    if (random() < 3 * dt) rect.life = 0
  }
  state.rects = state.rects.filter((rect) => rect.life > 0)
  for (const shift of state.shifts) {
    shift.life -= dt
    shift.reroll -= dt
    if (shift.reroll <= 0) {
      shift.reroll = SHIFT_REROLL_SECONDS
      shift.offset = Math.round(between(random, 1, 5)) * (random() < 0.5 ? -1 : 1)
    }
  }
  state.shifts = state.shifts.filter((shift) => shift.life > 0)

  if (random() < spawnRate(input.level, input.ratio, input.probability) * dt) {
    const burst = 1 + Math.floor(random() * 4)
    for (let i = 0; i < burst; i++) spawn(state, input, random)
  }
  if (random() < shiftRate(input.level, input.ratio, input.probability) * dt) {
    state.shifts.push({
      id: state.next++,
      row: Math.floor(random() * input.height),
      offset: 0,
      life: SHIFT_SECONDS,
      reroll: 0,
    })
  }
}
