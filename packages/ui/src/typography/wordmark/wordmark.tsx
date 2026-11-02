import { createUniqueId, type ComponentProps } from "solid-js"
import { GLYPHS, place } from "../../components/logo"

// Capri: the "Capri" wordmark in one color (currentColor), replacing opencode's. `outline` draws stroked letters with a
// normalized path length, which the desktop first-launch splash animates (stroke draw, then fill). `fade` keeps the
// bottom fade-out and `muted` the low opacity of the original component.
const LETTERS = ["c", "a", "p", "r", "i", "dot"] as const

export function Wordmark(
  props: Pick<ComponentProps<"svg">, "class"> & { fade?: boolean; muted?: boolean; outline?: boolean },
) {
  const mask = createUniqueId()
  const maskGradient = createUniqueId()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="30 15 830 425"
      fill="none"
      classList={{
        [props.class ?? ""]: !!props.class,
        "overflow-visible [&_path]:[vector-effect:non-scaling-stroke]": props.outline,
      }}
    >
      <g opacity={props.muted === false ? 1 : 0.6} class="[[data-color-scheme=dark]_&]:opacity-100">
        <g mask={props.fade === false ? undefined : `url(#${mask})`}>
          <g
            opacity={props.muted === false ? 1 : 0.16 * 0.7}
            fill="currentColor"
            fill-opacity={props.outline ? 0 : undefined}
            stroke={props.outline ? "currentColor" : undefined}
            stroke-width={props.outline ? 2 : undefined}
            stroke-linejoin="miter"
          >
            {LETTERS.map((name) => (
              <path
                pathLength={props.outline ? 1 : undefined}
                transform={place(GLYPHS[name].at[0], GLYPHS[name].at[1])}
                d={GLYPHS[name].d}
                fill-rule="evenodd"
              />
            ))}
          </g>
        </g>
      </g>
      <defs>
        <mask id={mask} style="mask-type:alpha" maskUnits="userSpaceOnUse" x="30" y="15" width="830" height="425">
          <rect x="30" y="15" width="830" height="425" fill={`url(#${maskGradient})`} />
        </mask>
        <linearGradient id={maskGradient} x1="445" y1="240" x2="445" y2="440" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.7" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
