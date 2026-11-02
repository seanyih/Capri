import { createUniqueId, type ComponentProps } from "solid-js"

// Capri logo for the GUI, drawn from capri_dev/capri-logo.svg: skewed pink-gradient letters, a purple drop shade,
// green spike tips and glitch blocks. `mono` paints everything with the icon tokens instead (overlays, masks).

export const GLYPHS = {
  c: {
    at: [90, 130],
    d: "M150,0 L40,0 L0,40 L0,140 L120,222 L181.6,115.6 L118,181 L40,128 L40,50 L55,35 L150,35 L205,-85 Z",
    tips: ["184.1,-52.7 205.0,-85.0 184.1,-39.4", "158.2,156.0 181.6,115.6 157.4,140.5"],
  },
  a: {
    at: [285, 144],
    d: "M-18,34 L30,50 L98,50 L128,10 L120,58 L120,160 L136,192 L95,160 L25,160 L0,135 L0,75 Z M38,85 L82,85 L82,125 L38,125 Z",
    tips: ["116.6,25.2 128.0,10.0 125.0,28.2", "129.9,179.8 136.0,192.0 120.4,179.8", "0.2,40.1 -18.0,34.0 -11.2,49.6"],
  },
  p: {
    at: [448, 120],
    d: "M0,50 L50,50 L74,-28 L96,50 L100,50 L122,75 L122,135 L97,160 L38,160 L38,212 L19,246 L0,212 Z M38,85 L82,85 L82,125 L38,125 Z",
    tips: ["64.9,1.6 74.0,-28.0 82.4,1.6", "26.2,233.1 19.0,246.0 11.8,233.1"],
  },
  r: {
    at: [611, 146],
    d: "M0,50 L30,50 L30,66 L52,50 L110,50 L148,-4 L120,82 L30,82 L30,160 L15,205 L0,160 Z",
    tips: ["133.6,16.5 148.0,-4.0 137.4,28.7", "20.7,187.9 15.0,205.0 9.3,187.9"],
  },
  i: {
    at: [798, 122],
    d: "M0,50 L38,50 L38,160 L10,212 L0,160 Z",
    tips: ["20.6,192.2 10.0,212.0 6.2,192.2"],
  },
  dot: { at: [798, 122], d: "M26,-50 L40,8 L19,34 L0,8 Z", tips: [] as string[] },
} as const

type Glyph = keyof typeof GLYPHS

// [x, y, width, color] glitch blocks, 15px high, on the letter outlines.
const BLOCKS: Record<"c" | "rest", [number, number, number, string][]> = {
  c: [
    [48, 205, 40, "#FFFFFF"],
    [160, 123, 32, "#02F968"],
    [88, 300, 24, "#FF3885"],
    [112, 393, 40, "#02F968"],
  ],
  rest: [
    [303, 198, 40, "#FFFFFF"],
    [231, 300, 32, "#FF3885"],
    [293, 340, 48, "#02F968"],
    [371, 330, 24, "#FFFFFF"],
    [533, 236, 32, "#02F968"],
    [453, 176, 40, "#FF3885"],
    [563, 296, 32, "#02F968"],
    [633, 252, 48, "#FFFFFF"],
    [751, 276, 24, "#FF3885"],
    [813, 200, 32, "#FFFFFF"],
  ],
}

export const place = (x: number, y: number) => `translate(${x},${y}) skewX(-16) scale(1,1.22)`

function Art(props: { glyphs: readonly Glyph[]; blocks: readonly ("c" | "rest")[]; mono?: boolean }) {
  const id = `capri-hair-${createUniqueId()}`
  const main = () => (props.mono ? "var(--icon-strong-base)" : `url(#${id})`)
  const shade = () => (props.mono ? "var(--icon-weak-base)" : "#8536C9")
  const tip = () => (props.mono ? "var(--icon-strong-base)" : "#02F968")
  const glyphs = props.glyphs.map((name) => GLYPHS[name])
  const blocks = props.blocks.flatMap((name) => BLOCKS[name])
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stop-color="#FF3885" />
          <stop offset="1" stop-color="#FA064D" />
        </linearGradient>
      </defs>
      {glyphs.map((glyph) => (
        <path transform={place(glyph.at[0] + 10, glyph.at[1] + 10)} d={glyph.d} fill={shade()} fill-rule="evenodd" />
      ))}
      {glyphs.map((glyph) => (
        <path transform={place(glyph.at[0], glyph.at[1])} d={glyph.d} fill={main()} fill-rule="evenodd" />
      ))}
      {glyphs.map((glyph) =>
        glyph.tips.map((points) => <polygon transform={place(glyph.at[0], glyph.at[1])} points={points} fill={tip()} />),
      )}
      {/* The i-dot is solid green over its pink/purple copies. */}
      {props.glyphs.includes("dot") && (
        <path transform={place(GLYPHS.dot.at[0], GLYPHS.dot.at[1])} d={GLYPHS.dot.d} fill={tip()} />
      )}
      {blocks.map(([x, y, width, color]) => (
        <rect x={x} y={y} width={width} height={15} fill={props.mono ? "var(--icon-strong-base)" : color} />
      ))}
    </>
  )
}

// Square-ish "C" mark (4:5), used where opencode drew its small block "O".
export const Mark = (props: { class?: string; mono?: boolean }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="28 18 320 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Art glyphs={["c"]} blocks={["c"]} mono={props.mono} />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="28 18 320 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Art glyphs={["c"]} blocks={["c"]} />
    </svg>
  )
}

// Full "Capri" wordmark, aspect 830/425.
export const Logo = (props: { class?: string; mono?: boolean }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="30 15 830 425"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <Art glyphs={["c", "a", "p", "r", "i", "dot"]} blocks={["c", "rest"]} mono={props.mono} />
    </svg>
  )
}
