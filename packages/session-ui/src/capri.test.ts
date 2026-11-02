import { expect, test } from "bun:test"
import { agentLabel, defaults, encrypt, normalize } from "./capri"

// Capri: GUI settings must default like the TUI's capri-config.ts, and the cipher must match the TUI's.
test("normalize fills TUI defaults and clamps numbers", () => {
  expect(normalize(undefined)).toEqual(defaults)
  expect(normalize({ cyberpsycosis: "max", glitchProbability: 99, glitchContext: 2, hide: { thinking: false } })).toEqual({
    ...defaults,
    cyberpsycosis: "max",
    glitchProbability: 10,
    glitchContext: 1,
    hide: { ...defaults.hide, thinking: false },
  })
  expect(normalize({ cyberpsycosis: "extreme" }).cyberpsycosis).toBe("none")
})

test("encrypt keeps whitespace, hides everything else, and is stable for a streamed prefix", () => {
  const text = "**Plan**\nread the file"
  const out = encrypt(text)
  expect(out.length).toBe(text.length)
  expect(out.split("\n").length).toBe(2)
  expect(out).not.toMatch(/[A-Za-z*]/)
  expect(encrypt(text.slice(0, 6))).toBe(out.slice(0, 6))
})

test("the build agent is labelled Capri", () => {
  expect(agentLabel("build")).toBe("Capri")
  expect(agentLabel("plan")).toBe("Plan")
  expect(agentLabel(undefined)).toBe("")
})
