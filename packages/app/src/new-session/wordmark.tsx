import { Logo } from "@opencode/ui/logo"
import "./wordmark.css"

// Capri: the colored wordmark replaces opencode's faded mono one; the shimmer sweep stays a mono overlay.
export function NewSessionWordmark() {
  return (
    <div
      data-component="new-session-wordmark"
      aria-hidden="true"
      class="pointer-events-none mx-auto w-full max-w-[720px] text-v2-background-bg-inverse"
    >
      <div data-slot="wordmark-reveal" class="relative mx-auto w-1/2">
        <Logo class="block aspect-[830/425] w-full opacity-90" />
        <Logo mono class="wordmark-shimmer absolute inset-0 aspect-[830/425] w-full" />
      </div>
    </div>
  )
}
