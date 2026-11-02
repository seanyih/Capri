#!/usr/bin/env bun
// Renders capri/desktop/icon.svg (with icon-art.png inlined) into every app icon the GUI needs:
//   capri/desktop/icons/   electron-builder set (icon.icns, icon.ico, icon.png, NxN.png, dock.png, Square*Logo.png)
//   capri/desktop/favicon/ renderer favicons (packages/ui/src/assets/favicon/*-v3.*, web manifest PNGs)
// Run from the repo root after editing icon.svg: `bun capri/desktop/gen-icons.ts`, then `capri/sync.sh`.
// sharp is not a direct dependency of any workspace, so it is loaded from bun's install store.
import { mkdir, readdir } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "../..")
const here = import.meta.dirname
const store = path.join(root, "node_modules", ".bun")
const version = (await readdir(store))
  .filter((name) => /^sharp@\d/.test(name))
  .sort()
  .at(-1)
if (!version) throw new Error("sharp not found in node_modules/.bun; run bun install")
const sharp = (await import(path.join(store, version, "node_modules", "sharp"))).default

// icon.svg points at icon-art.png; inline it so sharp (librsvg) does not have to resolve a relative file.
const art = Buffer.from(await Bun.file(path.join(here, "icon-art.png")).arrayBuffer()).toString("base64")
const master = (await Bun.file(path.join(here, "icon.svg")).text()).replace(
  'href="icon-art.png"',
  `href="data:image/png;base64,${art}"`,
)
// Full-bleed variant (tile only, no macOS inset) for favicons and small Windows/Linux sizes.
const tile = master.replace('viewBox="0 0 1024 1024"', 'viewBox="100 100 824 824"')

const render = (svg: string, size: number): Promise<Buffer> =>
  sharp(Buffer.from(svg), { density: Math.max(72, (72 * size) / 1024) * 4 })
    .resize(size, size)
    .png()
    .toBuffer()

// ICO: directory of PNG-compressed images (Vista+).
function ico(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6 + images.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((image, i) => {
    const entry = 6 + i * 16
    header.writeUInt8(image.size >= 256 ? 0 : image.size, entry)
    header.writeUInt8(image.size >= 256 ? 0 : image.size, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(image.png.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += image.png.length
  })
  return Buffer.concat([header, ...images.map((image) => image.png)])
}

// ICNS: big-endian chunk list of PNG payloads.
function icns(chunks: { type: string; png: Buffer }[]) {
  const parts = chunks.map((chunk) => {
    const head = Buffer.alloc(8)
    head.write(chunk.type, 0, "ascii")
    head.writeUInt32BE(chunk.png.length + 8, 4)
    return Buffer.concat([head, chunk.png])
  })
  const head = Buffer.alloc(8)
  head.write("icns", 0, "ascii")
  head.writeUInt32BE(8 + parts.reduce((sum, part) => sum + part.length, 0), 4)
  return Buffer.concat([head, ...parts])
}

const icons = path.join(here, "icons")
const favicon = path.join(here, "favicon")
await mkdir(icons, { recursive: true })
await mkdir(favicon, { recursive: true })

const inset = new Map<number, Buffer>()
const full = new Map<number, Buffer>()
for (const size of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) inset.set(size, await render(master, size))
for (const size of [16, 24, 30, 32, 44, 48, 50, 64, 71, 89, 96, 107, 128, 142, 150, 180, 192, 256, 284, 310, 512])
  full.set(size, await render(tile, size))
const at = (map: Map<number, Buffer>, size: number) => map.get(size)!

// macOS: inset artwork, like every Big Sur+ app icon.
await Bun.write(
  path.join(icons, "icon.icns"),
  icns([
    { type: "icp4", png: at(inset, 16) },
    { type: "icp5", png: at(inset, 32) },
    { type: "icp6", png: at(inset, 64) },
    { type: "ic07", png: at(inset, 128) },
    { type: "ic08", png: at(inset, 256) },
    { type: "ic09", png: at(inset, 512) },
    { type: "ic10", png: at(inset, 1024) },
    { type: "ic11", png: at(inset, 32) },
    { type: "ic12", png: at(inset, 64) },
    { type: "ic13", png: at(inset, 256) },
    { type: "ic14", png: at(inset, 512) },
  ]),
)
await Bun.write(path.join(icons, "dock.png"), at(inset, 256))

// Windows and Linux: full-bleed tile, so the icon is not tiny in the taskbar.
await Bun.write(
  path.join(icons, "icon.ico"),
  ico([16, 24, 32, 48, 64, 128, 256].map((size) => ({ size, png: at(full, size) }))),
)
await Bun.write(path.join(icons, "icon.png"), at(full, 512))
await Bun.write(path.join(icons, "32x32.png"), at(full, 32))
await Bun.write(path.join(icons, "64x64.png"), at(full, 64))
await Bun.write(path.join(icons, "128x128.png"), at(full, 128))
await Bun.write(path.join(icons, "128x128@2x.png"), at(full, 256))
await Bun.write(path.join(icons, "StoreLogo.png"), at(full, 50))
for (const size of [30, 44, 71, 89, 107, 142, 150, 284, 310])
  await Bun.write(path.join(icons, `Square${size}x${size}Logo.png`), at(full, size))

await Bun.write(path.join(favicon, "favicon-v3.svg"), tile)
await Bun.write(path.join(favicon, "favicon-v3.ico"), ico([16, 32, 48].map((size) => ({ size, png: at(full, size) }))))
await Bun.write(path.join(favicon, "favicon-96x96-v3.png"), at(full, 96))
await Bun.write(path.join(favicon, "apple-touch-icon-v3.png"), at(full, 180))
await Bun.write(path.join(favicon, "web-app-manifest-192x192.png"), at(full, 192))
await Bun.write(path.join(favicon, "web-app-manifest-512x512.png"), at(full, 512))

console.log(`Rendered icons into ${path.relative(root, icons)} and ${path.relative(root, favicon)}`)
