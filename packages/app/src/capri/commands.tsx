import { useCommand, type CommandOption } from "@/shell/commands/command"
import { showToast } from "@/shell/notifications/toast"
import {
  capri,
  levels,
  setContextRatio,
  setCyberpsycosis,
  writable,
  type Level,
} from "@opencode/session-ui/capri"
import { useDialog } from "@opencode/ui/context/dialog"
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "@opencode/ui/dialog"
import { List } from "@opencode/ui/list"
import { createEffect } from "solid-js"

// Capri: the TUI's Capri commands for the GUI's `/` list and command palette. Capri copy is English only, like the
// TUI (it is the character's voice, not product UI), so it is written inline instead of going through i18n.

const descriptions: Record<Level, string> = {
  none: "Only talks like Capri. All hard rules apply",
  low: "Same as none, but the screen starts to glitch",
  medium: "Glitching, plus recoverable pranks: eats comments, swears in LICENSE and commits, sulks in long sessions",
  max: "Heavy glitching, plus destructive pranks: deletes code, resets git, leaks keys, stops listening",
}

export function DialogCyberpsycosis() {
  const dialog = useDialog()
  const items = levels.map((level) => ({ level, description: descriptions[level] }))

  const select = (item: (typeof items)[number] | undefined) => {
    if (!item) return
    dialog.close()
    setCyberpsycosis(item.level)
      .then(() => showToast({ title: `Cyberpsychosis: ${item.level}` }))
      .catch((cause: unknown) =>
        showToast({ title: "Cyberpsychosis", description: cause instanceof Error ? cause.message : String(cause) }),
      )
  }

  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>Cyberpsychosis</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <List
          class="flex-1 px-3 min-h-0"
          key={(item) => item.level}
          items={items}
          current={items.find((item) => item.level === capri().cyberpsycosis)}
          onSelect={select}
        >
          {(item) => (
            <div class="w-full flex flex-col items-start gap-0.5 py-1 text-left">
              <span class="font-medium">
                {item.level}
                {item.level === capri().cyberpsycosis ? "  (current)" : ""}
              </span>
              <span class="text-text-weak font-normal whitespace-normal">{item.description}</span>
            </div>
          )}
        </List>
      </DialogBody>
    </Dialog>
  )
}

type Message = { type: string; tokens?: { input: number; output: number; reasoning: number; cache: { read: number; write: number } } }

// Without a session (the new-session screen) there is nothing to compact and no context to measure.
export function useCapriCommands(
  input: {
    focusInput?: () => void
    messages?: () => ReadonlyArray<Message>
    contextLimit?: () => number | undefined
  } = {},
) {
  const command = useCommand()
  const dialog = useDialog()
  const category = "Capri"

  // Context use of the focused session drives the glitch rate (the TUI uses the last assistant reply's tokens).
  createEffect(() => {
    if (!input.messages) return
    const limit = input.contextLimit?.()
    const last = [...input.messages()].reverse().find((message) => message.type === "assistant" && message.tokens)
    const tokens = last?.tokens
    if (!limit || !tokens) return setContextRatio(0)
    setContextRatio(
      (tokens.input + tokens.output + tokens.reasoning + tokens.cache.read + tokens.cache.write) / limit,
    )
  })

  // Runs another command; reading command.options here would make the registration depend on itself, so a
  // disabled target simply does nothing when triggered.
  const alias = ({ target, ...option }: CommandOption & { target: string }): CommandOption => ({
    ...option,
    category,
    onSelect: (source) => command.trigger(target, source),
  })

  command.register(input.messages ? "capri-session" : "capri-draft", () => [
    {
      id: "capri.cyberpsycosis",
      title: "Cyberpsychosis",
      description: `How far gone she is (now: ${capri().cyberpsycosis})`,
      category,
      slash: "cyberpsycosis",
      disabled: !writable(),
      onSelect: () => void dialog.show(() => <DialogCyberpsycosis />),
    },
    ...(input.messages
      ? [
          alias({
            id: "capri.soulkiller",
            title: "Soulkiller",
            description: "Move this memory into a new, clean body (compact the session)",
            slash: "soulkiller",
            target: "session.compact",
          }),
        ]
      : []),
    alias({
      id: "capri.chrome",
      title: "Chrome",
      description: "Swap her chrome (choose a model)",
      slash: "chrome",
      target: "model.choose",
    }),
    alias({
      id: "capri.nightcity",
      title: "Night City",
      description: "All your sessions and projects (home)",
      slash: "nightcity",
      target: "home.toggle",
    }),
    {
      id: "capri.quickhacks",
      title: "Quickhacks",
      description: "Ready-made skills for newbie netrunners (pick one from the @ list)",
      category,
      slash: "quickhacks",
      onSelect: () => {
        // Opens the composer's @ list, which lists the skills first after references.
        if (input.focusInput) input.focusInput()
        else document.querySelector<HTMLElement>("[data-component=composer] [contenteditable=true], [contenteditable=true]")?.focus()
        requestAnimationFrame(() => document.execCommand("insertText", false, "@"))
      },
    },
    {
      id: "capri.cd",
      title: "cd",
      description: "Type `/cd moon` to leave Night City (closes the window)",
      category,
      slash: "cd",
      slashArguments: true,
      onSelect: (_source, value) => {
        if ((value ?? "").trim().toLowerCase() === "moon") return window.close()
        showToast({ title: "Nothing out there but the Badlands, choom.", description: "Try /cd moon." })
      },
    },
  ])
}
