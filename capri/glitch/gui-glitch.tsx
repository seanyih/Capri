import { capri, contextRatio } from "@opencode/session-ui/capri"
import { createEffect, createSignal, For, onCleanup } from "solid-js"
import * as Glitch from "./glitch-engine"

// Capri: the cyberpsychosis screen glitch, ported from the TUI (capri/glitch/cyber-glitch.tsx). A click-through layer
// over the whole window: colored blocks that streak sideways and flicker, plus "torn" rows. Rate = level x context use x
// glitchProbability, exactly like the terminal. Off at `none`, when glitchProbability is 0, and with reduced motion.

const FRAME_MS = 50
// One terminal cell, so blocks have the TUI's proportions.
const CELL_W = 8
const CELL_H = 18

type Frame = { rects: Glitch.Rect[]; shifts: Glitch.Shift[] }

export function CapriGlitch() {
  const [frame, setFrame] = createSignal<Frame>({ rects: [], shifts: [] })
  const [reduced, setReduced] = createSignal(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
  const onMotion = () => setReduced(motion.matches)
  motion.addEventListener("change", onMotion)
  onCleanup(() => motion.removeEventListener("change", onMotion))

  createEffect(() => {
    const settings = capri()
    if (settings.cyberpsycosis === "none" || settings.glitchProbability === 0 || reduced()) return
    const state = Glitch.create()
    let last = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      const dt = Math.min(0.25, (now - last) / 1000)
      last = now
      const was = Glitch.active(state)
      Glitch.step(state, dt, {
        level: capri().cyberpsycosis,
        ratio: contextRatio(),
        probability: capri().glitchProbability,
        width: Math.floor(window.innerWidth / CELL_W),
        height: Math.floor(window.innerHeight / CELL_H),
      })
      // Repaint while glitching, and once more after the last block expires so it does not stay on screen.
      if (!was && !Glitch.active(state)) return
      setFrame({
        rects: state.rects.filter((rect) => Math.random() >= rect.flicker).map((rect) => ({ ...rect })),
        shifts: state.shifts.map((shift) => ({ ...shift })),
      })
    }, FRAME_MS)
    onCleanup(() => {
      clearInterval(timer)
      setFrame({ rects: [], shifts: [] })
    })
  })

  return (
    <div
      data-component="capri-glitch"
      aria-hidden="true"
      style={{ position: "fixed", inset: "0", "pointer-events": "none", "z-index": "2147483000", overflow: "hidden" }}
    >
      <For each={frame().shifts}>
        {(shift) => (
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              top: `${shift.row * CELL_H}px`,
              height: `${CELL_H}px`,
              transform: `translateX(${shift.offset * CELL_W}px)`,
              // A torn row: the text behind it hue-shifts, with a pink-to-green tint so it shows on a black UI.
              "backdrop-filter": "hue-rotate(90deg) saturate(3) contrast(1.4)",
              background: "linear-gradient(90deg, rgba(255, 56, 133, 0.28), rgba(2, 249, 104, 0.18))",
              "mix-blend-mode": "screen",
              "border-left": "2px solid #FF3885",
              "border-right": "2px solid #02F968",
            }}
          />
        )}
      </For>
      <For each={frame().rects}>
        {(rect) => (
          <div
            style={{
              position: "absolute",
              left: `${Math.round(rect.x) * CELL_W}px`,
              top: `${rect.y * CELL_H}px`,
              width: `${rect.width * CELL_W}px`,
              height: `${rect.height * CELL_H}px`,
              background: rect.color,
            }}
          />
        )}
      </For>
    </div>
  )
}
