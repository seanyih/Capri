import { afterEach, beforeEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { parseJsonc, read, setCyberpsycosis } from "./capri-file"

// Capri: capri.json is shared with the TUI and CLI, so the GUI must read its JSONC and edit it without losing the rest.
let dir: string
const previous = { config: process.env.XDG_CONFIG_HOME, level: process.env.CAPRI_CYBERPSYCOSIS }

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "capri-config-"))
  process.env.XDG_CONFIG_HOME = dir
  delete process.env.CAPRI_CYBERPSYCOSIS
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
  if (previous.config === undefined) delete process.env.XDG_CONFIG_HOME
  else process.env.XDG_CONFIG_HOME = previous.config
  if (previous.level !== undefined) process.env.CAPRI_CYBERPSYCOSIS = previous.level
})

const write = async (text: string) => {
  await mkdir(path.join(dir, "capri"), { recursive: true })
  await writeFile(path.join(dir, "capri", "capri.json"), text)
}
const contents = () => readFile(path.join(dir, "capri", "capri.json"), "utf8")

test("parses comments and trailing commas but keeps // inside strings", () => {
  expect(parseJsonc('{\n  // c\n  "a": "http://x", /* b */ "n": [1, 2,],\n}')).toEqual({ a: "http://x", n: [1, 2] })
})

test.each([
  ["no file", undefined, '{\n  "cyberpsycosis": "max"\n}\n'],
  ["empty object", "{}", '{\n  "cyberpsycosis": "max"\n}\n'],
  ["other keys only", '{\n  // keep\n  "hide": { "thinking": false }\n}', '{\n  "cyberpsycosis": "max",\n  // keep\n  "hide": { "thinking": false }\n}'],
  ["existing level", '{\n  "cyberpsycosis": "low", // keep\n}', '{\n  "cyberpsycosis": "max", // keep\n}'],
])("setCyberpsycosis with %s", async (_name, before, after) => {
  if (before !== undefined) await write(before)
  setCyberpsycosis("max")
  expect(await contents()).toBe(after)
  expect(read().cyberpsycosis).toBe("max")
})

test("CAPRI_CYBERPSYCOSIS overrides the file", async () => {
  await write('{ "cyberpsycosis": "low" }')
  process.env.CAPRI_CYBERPSYCOSIS = "medium"
  expect(read().cyberpsycosis).toBe("medium")
})

test("a broken file reads as empty", async () => {
  await write("{ nope")
  expect(read()).toEqual({})
})
