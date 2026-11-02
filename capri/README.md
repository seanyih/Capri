# capri/

Capri customizations, developed here first and then copied over the designated upstream files. `capri/` tracks
every Capri-related file (see `CLAUDE.md`).

```
capri/
├── sync.sh        copy tool (capri/ <-> packages/)
├── prompts/       persona and cyberpsycosis prompts
├── glitch/        screen glitch and the /cyberpsycosis picker
├── config/        capri.json reading and writing
├── logo/          logo art and renderers (TUI and GUI)
├── theme/         color themes (TUI and GUI)
├── desktop/       desktop app icon master, icon generator, rendered icons
├── ci/            GitHub workflow for GUI releases
├── skills/        on-demand skills (Cyberpunk lore)
├── install/       installer
├── docs/          project README, GUI guide
├── tests/         tests changed for Capri
└── upstream/      snapshots of edited upstream opencode files
```

`./sync.sh` copies everything into `packages/` (edit here first); `./sync.sh from-repo` copies the code back. Prompts
lose their header on the way (everything up to the first `---`) and land in
`packages/core/src/session/runner/prompt/capri/*.txt`. The `upstream/` files are whole-file snapshots: after merging
upstream opencode changes, run `from-repo` before editing here, or the merge is overwritten.

## prompts/

| File | Function |
|---|---|
| `CAPRI.md` | Capri persona system prompt (personality, background, voice, behavior limits). Applies to every model family. Text below the `---` line is the prompt. Becomes `persona.txt`. |
| `cyberpsycosis-none.md`, `-low.md`, `-medium.md`, `-max.md` | Tunable "cyberpsychosis" modules appended after `CAPRI.md`. none = voice only; low = same prompt, but the TUI glitches; medium = recoverable pranks; max = destructive pranks. Effects table: `capri_dev/cyberpsycosis-levels-summary.md`. |

## glitch/

| File | Target | Function |
|---|---|---|
| `glitch.ts` | `packages/tui/src/glitch.ts` | Glitch engine: rectangles, row shifts, rates by level and context use, painting. Applies to low, medium and max. |
| `glitch.test.ts` | `packages/tui/test/glitch.test.ts` | Tests for the glitch engine. |
| `cyber-glitch.tsx` | `packages/tui/src/component/cyber-glitch.tsx` | Mounts the glitch on the renderer's post-process pass. |
| `dialog-cyberpsycosis.tsx` | `packages/tui/src/component/dialog-cyberpsycosis.tsx` | The `/cyberpsycosis` level picker. |

## config/

| File | Target | Function |
|---|---|---|
| `capri.ts` | `packages/core/src/capri.ts` | Reads and writes `~/.config/capri/capri.json`: `cyberpsycosis` level, `glitchProbability` multiplier (default 1, 0 = off). |
| `capri-config.ts` | `packages/tui/src/capri-config.ts` | Reads `capri.json` for the TUI: `logo.style`, `hide.thinking`, `hide.toolResults`, `hide.skills`, `footer.name/model/tps`. |

## logo/

| File | Target | Function |
|---|---|---|
| `logo.ts` | `packages/tui/src/logo.ts` | Quadrant-block wordmark (the default character art). |
| `logo-halfblock.ts` | `packages/tui/src/logo-halfblock.ts` | Half-block wordmark. |
| `logo-image.ts` | `packages/tui/src/logo-image.ts` | Inline PNG for kitty/sixel terminals. |
| `gui-logo.tsx` | `packages/ui/src/components/logo.tsx` | GUI `Logo` (wordmark), `Mark` and `Splash` ("C") as SVG, drawn from `capri_dev/capri-logo.svg`; `mono` prop paints with icon tokens. |

Source masters and preview renders live in the git-ignored `capri_dev/`.

## theme/

| File | Target | Function |
|---|---|---|
| `capri-theme.json` | `packages/tui/src/theme/assets/v2/opencode.json` | Dark-only v2 TUI color theme (replaces the built-in v2 `opencode` theme). |
| `capri-desktop-theme.json` | `packages/ui/src/theme/themes/oc-2.json` | Desktop theme named "Capri" in the default `oc-2` slot: dark variant (black, pink, green, purple borders, explicit grey ramp) and a light day variant. |

## desktop/

| File | Target | Function |
|---|---|---|
| `icon.svg` | | App icon master: the wordmark's "C" on a black tile with a purple rim (1024px, macOS inset). |
| `gen-icons.ts` | | `bun capri/desktop/gen-icons.ts` renders `icon.svg` with sharp into `icons/` and `favicon/` (writes `.icns`/`.ico` itself). |
| `icons/*` | `packages/desktop/icons/{dev,beta,prod}/*` | Electron icons: `icon.icns` (inset), `icon.ico`, `icon.png`, `NxN.png`, `dock.png`, `Square*Logo.png`. |
| `favicon/*` | `packages/ui/src/assets/favicon/*` | Renderer favicons (`favicon-v3.*`, `favicon-96x96-v3.png`, `apple-touch-icon-v3.png`, web manifest PNGs). |

## ci/

| File | Target | Function |
|---|---|---|
| `capri-desktop.yml` | `.github/workflows/capri-desktop.yml` | On a `v*` tag: cross-builds the CLI, packages the desktop app on macOS arm64/x64, Windows x64 and Linux x64, uploads installers and CLI archives to a draft release. See `docs/GUI.md`. |

## skills/

On-demand skills for Capri. Only the skill name and one-line description sit in the default prompt; the body and the
references load when the model calls the `skill` tool and reads a file, so they cost tokens only when used.

| File | Target | Function |
|---|---|---|
| `cyberpunk-lore/SKILL.md` | `.opencode/skills/cyberpunk-lore/SKILL.md` | Entry point: when to load, accuracy rules, and a cheat sheet of the most-asked facts (world, corps, gangs, chrome, slang, S1/S2/2077 one-liners). |
| `cyberpunk-lore/references/characters.md` | `.opencode/skills/cyberpunk-lore/references/characters.md` | Who's who: Edgerunners 2 (D, Roman, Weak, Talia, Kyoko, Capri...), Edgerunners S1, and 2077. |
| `cyberpunk-lore/references/factions.md` | `.opencode/skills/cyberpunk-lore/references/factions.md` | Megacorps, NCPD/Max-Tac/Trauma Team, gangs table, nomads. |
| `cyberpunk-lore/references/places.md` | `.opencode/skills/cyberpunk-lore/references/places.md` | Night City districts and landmarks (Arasaka Tower, Afterlife...), Badlands, Moon, Net. |
| `cyberpunk-lore/references/tech.md` | `.opencode/skills/cyberpunk-lore/references/tech.md` | Chrome (Sandevistan, Mantis Blades...), cyberpsychosis, netrunning, braindance. |
| `cyberpunk-lore/references/timeline.md` | `.opencode/skills/cyberpunk-lore/references/timeline.md` | History, S1 and Edgerunners 2 episode beats, 2077 plot. Sourced from cyberpunk.fandom.com; thin spots are marked "(thin)". |
| `cyberpunk-lore/references/slang.md` | `.opencode/skills/cyberpunk-lore/references/slang.md` | Street slang trimmed from the wiki's Streetslang page, tiered by how safe each word is to say (use lightly), plus Net and solo jargon. |

## install/

| File | Target | Function |
|---|---|---|
| `install.sh` | `install` | Linux and macOS installer (also run by the macOS desktop's "Install CLI…"): downloads the release (or `--binary` for a local build), installs it as `~/.capri/bin/capri`, adds it to `PATH`, writes the default `~/.config/capri/capri.json` unless one exists, and installs the `capri/skills` files to `~/.config/opencode/skills/` (copied from a checkout, else fetched from the repo; rerun refreshes them). Replaces opencode's installer. |
| `install.ps1` | `install.ps1` | Windows (x64) installer: same steps as `install.sh` — downloads `capri-windows-x64.zip` (or `-Binary` for a local build), installs `%USERPROFILE%\.capri\bin\capri.exe`, adds it to the user `PATH`, writes `%USERPROFILE%\.config\capri\capri.json` unless one exists, installs the skills to `%USERPROFILE%\.config\opencode\skills\`. |

## docs/

| File | Target | Function |
|---|---|---|
| `README.md` | `README.md` | Project README (English only): install (CLI and desktop), features, cyberpsychosis levels, `capri.json` options, opencode MIT attribution, NVIDIA NIM appendix. Replaces opencode's README. |
| `GUI.md` | | Desktop app guide: how the GUI is layered, what v0.2.0 changes, local builds, the release workflow and signing, and how to port more Capri features to the GUI. |

## tests/ (GUI)

| File | Target | Function |
|---|---|---|
| `ui-theme-v2-resolve.test.ts` | `packages/ui/src/theme/v2/resolve.test.ts` | Default-theme grey values pinned to the Capri ramp. |

## upstream/ (snapshots of edited opencode files)

| File | Target | Capri edit |
|---|---|---|
| `session-index.tsx` | `packages/tui/src/routes/session/index.tsx` | `ToolPart` hides tool output/diffs (`hide.toolResults`); skill-load lines hidden (`hide.skills`); `AssistantFooter` shows the Capri label, and model and tok/s only if enabled. `/soulkiller` is an alias of `/compact`. OpenCode Go upsell dialog and notice removed. |
| `message-parts.tsx` | `packages/tui/src/routes/session/message-parts.tsx` | `reasoningContent` scrambles thinking (`hide.thinking`). |
| `app.tsx` | `packages/tui/src/app.tsx` | `/chrome` aliases `/models`, `/nightcity` aliases `/sessions`. `/update` command removed; terminal title is `Capri`. |
| `prompt-index.tsx` | `packages/tui/src/component/prompt/index.tsx` | Prompt box shows the Capri label, and model/provider/variant only if `footer.model`. `/quickhacks` aliases `/skills`. `/cd moon` quits (alias of `/exit`, even if `moon/` is missing). |
| `prompt-footer.tsx` | `packages/tui/src/feature-plugins/prompt/footer.tsx` | Removed the `shift+tab agents` hint. |
| `keybind.ts` | `packages/tui/src/config/keybind.ts` | `agent.cycle` default is `none` (no shift+tab switch to Plan). |
| `attention.ts` | `packages/tui/src/attention.ts` | Notification default title is `Capri`. |
| `mini-runtime-lifecycle.ts` | `packages/tui/src/mini/runtime.lifecycle.ts` | Mini-mode terminal title says `Capri`. |
| `cli-default.ts` | `packages/cli/src/commands/handlers/default.ts` | Background updater and the TUI `updater` hook removed, so Capri never self-updates to opencode. |
| `permission.tsx` | `packages/tui/src/routes/session/permission.tsx` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `mini-footer-permission.tsx` | `packages/tui/src/mini/footer.permission.tsx` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `error-component.tsx` | `packages/tui/src/component/error-component.tsx` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `terminal-pane.tsx` | `packages/tui/src/component/terminal-pane.tsx` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `mini-footer-prompt.tsx` | `packages/tui/src/mini/footer.prompt.tsx` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `error-details.ts` | `packages/tui/src/util/error-details.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `tui-config-index.tsx` | `packages/tui/src/config/index.tsx` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `sidebar-footer.tsx` | `packages/tui/src/feature-plugins/sidebar/footer.tsx` | Removed the "OpenCode includes free models" line. |
| `dialog-pair.tsx` | `packages/tui/src/component/dialog-pair.tsx` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `tui-error.ts` | `packages/tui/src/util/error.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `mini-splash.ts` | `packages/tui/src/mini/splash.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-commands.ts` | `packages/cli/src/commands/commands.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-pair.ts` | `packages/cli/src/commands/handlers/pair.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-uninstall.ts` | `packages/cli/src/commands/handlers/uninstall.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-upgrade.ts` | `packages/cli/src/commands/handlers/upgrade.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-stats.ts` | `packages/cli/src/commands/handlers/stats.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-acp-handler.ts` | `packages/cli/src/commands/handlers/acp.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-mcp-auth.ts` | `packages/cli/src/commands/handlers/mcp/auth.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-acp-service.ts` | `packages/cli/src/acp/service.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-acp-error.ts` | `packages/cli/src/acp/error.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-acp-translate.ts` | `packages/cli/src/acp/translate.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-mini.ts` | `packages/cli/src/mini.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-mini-host.ts` | `packages/cli/src/mini-host.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-server-process.ts` | `packages/cli/src/server-process.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-remote-tunnel.ts` | `packages/cli/src/services/remote-tunnel.ts` | OpenCode wording replaced with Capri (`opencode <cmd>` hints are now `capri <cmd>`). |
| `cli-build.ts` | `packages/cli/script/build.ts` | `OPENCODE_CLI_NAME` is `capri`, so `--version` and help say `capri`. |
| `desktop-electron-builder.config.ts` | `packages/desktop/electron-builder.config.ts` | Product `Capri`, app ids `io.github.seanyih.capri[.dev/.beta]`, `capri-desktop-*` artifacts, no update feed, no legacy opencode launcher; signing opt-in (ad-hoc macOS without a certificate, Windows only with `CAPRI_WINDOWS_SIGN=true`). |
| `desktop-electron-builder.config.test.ts` | `packages/desktop/electron-builder.config.test.ts` | Expects the Capri app ids and no legacy launcher. |
| `desktop-constants.ts` | `packages/desktop/src/main/constants.ts` | Runtime app names/ids match the builder config. |
| `desktop-copy-metainfo.ts` | `packages/desktop/scripts/copy-metainfo.ts` | Linux AppStream metadata describes Capri. |
| `desktop-utils.ts` | `packages/desktop/scripts/utils.ts` | Accepts a non-baseline CLI build; signs the bundled CLI on Windows only with `CAPRI_WINDOWS_SIGN=true`. |
| `desktop-prebuild.ts` | `packages/desktop/scripts/prebuild.ts` | A supplied `OPENCODE_CLI_DIST` is used on every channel (otherwise dev/beta download opencode's CLI). |
| `desktop-package.json` | `packages/desktop/package.json` | Description, homepage and author are Capri's (electron-builder uses them). |
| `desktop-cli.ts` | `packages/desktop/src/main/service/desktop-cli.ts` | "Install CLI…" (macOS) reports `~/.capri/bin/capri`, where Capri's `install` puts it. |
| `desktop-window-defaults.ts` | `packages/desktop/src/main/windows/defaults.ts` | First-launch window background is the dark Capri theme. |
| `desktop-window-appearance.ts` | `packages/desktop/src/main/windows/appearance.ts` | Window title `Capri`. |
| `desktop-window-early.ts` | `packages/desktop/src/main/windows/early.ts` | Early window title `Capri`. |
| `desktop-index.html` | `packages/desktop/src/renderer/index.html` | Page title `Capri`. |
| `gui-updater-main.ts` | `packages/gui-extensions/src/updater/main.ts` | Updater off (`enabled = false`); opencode's feed would install OpenCode over Capri. |
| `ui-theme-context.tsx` | `packages/ui/src/theme/context.tsx` | Default theme named "Capri"; default color scheme `dark` instead of `system`. |
| `app-theme-preload.js` | `packages/app/public/oc-theme-preload.js` | Pre-paint script also defaults to dark. |
| `ui-favicon.tsx` | `packages/ui/src/components/favicon.tsx` | Apple web-app title `Capri`. |
| `ui-site.webmanifest` | `packages/ui/src/assets/favicon/site.webmanifest` | Web app name `Capri`. |
| `app-wordmark.tsx` | `packages/app/src/new-session/wordmark.tsx` | New-session screen shows the colored Capri wordmark (shimmer stays a mono overlay). |
| `app-windows-menu.tsx` | `packages/app/src/shell/titlebar/windows-menu.tsx` | Windows title-bar menu heading `Capri`. |
| `app-desktop-menu.ts` | `packages/app/src/shell/commands/desktop-menu.ts` | Help → Share Feedback / Report a Bug open the Capri repo's issues. |
| `app-desktop-native.ts` | `packages/app/src/runtime/i18n/desktop-native.ts` | English native strings: app menu, menu label, crash dialogs say Capri; CLI install message says `capri`. |
| `app-i18n-en.ts` | `packages/app/src/runtime/i18n/en.ts` | Settings → About describes Capri. |

## Edits to upstream files that are not copied here

| File | Change |
|---|---|
| `packages/core/src/session/system-prompt.ts` | Builds persona + active level + harness guidance. |
| `packages/core/src/session/runner/prompt/system.txt` | First line reworded; harness guidance kept. |
| `packages/core/src/plugin/optimize.ts` | `Plugins` is empty, so the model-family prompts are not used. |
| `packages/tui/src/app.tsx` | `/cyberpsycosis` command and the `<CyberGlitch />` mount. |
| `LICENSE` | Added the original opencode copyright line (MIT). |
| `README.*.md` (translations) | Deleted with opencode's README. |
| `packages/core/test/*`, `packages/tui/test/*` | Tests updated for the Capri prompt and theme. |
