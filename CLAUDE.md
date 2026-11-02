# Capri (opencode fork)

Capri-themed fork of opencode (Bun + TypeScript + Effect monorepo, v2.x, default branch `dev`).
Goal: Capri (Cyberpunk: Edgerunners S2 AI) branding — icon/logo, color theme, and a system prompt
that makes the model mock its accent. **Slices: CLI/TUI (Linux, Windows) and, since v0.2.0, the Electron desktop GUI
(Windows/macOS/Linux, see `capri/docs/GUI.md`).** VS Code is a later slice.

See `AGENTS.md` for upstream style/workflow rules (Effect patterns, theme-token rules, commit format). Follow them.

## Commands

- `bun install`
- `bun run dev` — run CLI/TUI from source (`packages/cli/src/index.ts`)
- `bun run typecheck` / `bun run lint` / `bun run check`
- Tests: run from the package dir, never from root (root `test` intentionally fails)
- Build binary: `bun run build` in `packages/cli` (`script/build.ts`)

## Layout — IN SCOPE (CLI slice)

| Path                                                                                                                       | Role                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/cli`                                                                                                             | Entry point; `bin/opencode.cjs`; `src/commands`, `src/run`, `src/ui`, build scripts                                                                                                 |
| `packages/tui`                                                                                                             | Terminal UI (OpenTUI + Solid). Logo: `src/logo.ts`, `src/component/logo.tsx`, `src/mini/splash.ts`, `src/routes/home.tsx`. Themes: `src/theme/` (+ `assets/*.json` built-in themes) |
| `packages/theme`                                                                                                           | Theme schema/resolution (`src/tui/*`: schema, resolve, expand, v1 migration)                                                                                                        |
| `packages/core`                                                                                                            | Agent runtime: sessions, providers, tools, permissions, config, MCP, plugins                                                                                                        |
| `packages/core/src/plugin/system-prompt/*.txt`                                                                             | Per-model-family system prompts (anthropic, gpt, kimi, meta, trinity…) — **main hook for the Capri accent prompt**                                                                  |
| `packages/core/src/session/runner/prompt/system.txt`                                                                       | Base session system prompt                                                                                                                                                          |
| `packages/core/src/agent.ts`, `session/instructions.ts`                                                                    | Agent definitions / instruction assembly                                                                                                                                            |
| `packages/server`, `packages/protocol`, `packages/schema`, `packages/client`, `packages/sdk`                               | HTTP API, shared schemas, generated client (don't hand-edit generated client; run `bun run generate` in `packages/client`)                                                          |
| `packages/plugin`, `packages/plugins`                                                                                      | Plugin API and bundled plugins                                                                                                                                                      |
| `packages/ai`, `packages/util`, `packages/codemode`, `packages/merman`, `packages/latex`, `packages/effect-drizzle-sqlite` | LLM provider layer and support libs                                                                                                                                                 |
| `packages/script`, `packages/http-recorder`, `packages/httpapi-codegen`, `packages/simulation`                             | Build/test tooling                                                                                                                                                                  |
| `packages/desktop`                                                                                                         | Electron shell: windows, menus, packaging (`electron-builder.config.ts`), bundles the CLI as `resources/opencode-cli`                                                              |
| `packages/app`, `packages/ui`, `packages/session-ui`                                                                       | GUI renderer (SolidJS): app shell, components/themes (`ui/src/theme/themes/oc-2.json` = Capri default), session timeline                                                           |
| `packages/gui-extensions`, `packages/plugin-browser`                                                                       | Built-in GUI features (updater is disabled), browser plugin                                                                                                                         |
| `.opencode/`                                                                                                               | Project-local opencode config: `opencode.jsonc`, `tui.json`, `themes/` (custom theme example `mytheme.json`), agents, skills, commands                                              |
| `script/`                                                                                                                  | Repo-level scripts (release, lint, ast-grep rules)                                                                                                                                  |
| `install`                                                                                                                  | Upstream curl installer script                                                                                                                                                      |

Dependency direction: Schema → Core/Protocol → Server; Client depends only on Schema/Protocol; `sdk` composes all.

## Layout — OUT OF SCOPE (git-ignored via `.gitignore`)

Later slices: `sdks/vscode`, `packages/storybook`.
Irrelevant: `packages/web`, `console`, `stats`, `posts`, `function`, `containers`, `identity`, `services/`, `infra/`, `github/`, `salesforce/`, `nix/`, `flake.*`, `sst*`, translated `README.*.md`, `CHANGELOG.md`, `STATS.md`, audit docs.
Note: these were already tracked upstream, so `.gitignore` only hides new/untracked files; they still exist in the working tree and in git. To hide them from `git status` fully, use `git rm -r --cached`, or just don't search them. Re-enable a slice by deleting its line in `.gitignore`.

## Capri customization map

- **Logo/icon**: `component/logo.tsx` picks a renderer: inline PNG (`logo-image.ts`, kitty/sixel terminals; flattened onto the theme background because sixel has no alpha), quadrant-block art (`logo.ts`), or half-block art (`logo-halfblock.ts`). Art is stored as rows of `[text, fg, bg]` runs indexing a palette. Source SVG/PNG masters live in `capri_dev/` (git-ignored). The exit-screen wordmark is in `util/presentation.ts`. `mini/splash.ts` still uses opencode's `go` art.
- **Capri settings**: `packages/tui/src/capri-config.ts` reads `capri.json` from `~/.config/capri/capri.json` (honors `XDG_CONFIG_HOME`), jsonc, shaped like tui.json but for Capri-only options. Read once per process (restart to apply). Add new Capri options to `Info` there. Current options:
  - `logo.style`: `"auto" | "image" | "quadrant" | "halfblock"`. Env `CAPRI_LOGO` overrides the file.
  - `hide.thinking` (default `true`): reasoning is rendered as scrambled glyphs (`encrypt` in `routes/session/message-parts.tsx`, applied inside `reasoningContent` so group-view titles are masked too). TUI-only; session data/transcript export are unaffected.
  - `hide.toolResults` (default `true`): `ToolPart` in `routes/session/index.tsx` drops tool output text and the `files`/`diff`/`filediff`/`diagnostics` metadata, so Edit/Patch fall back to their one-line form.
  - `footer.name` (default `"Capri"`): label for the default `build` agent in the reply footer (`AssistantFooter`) and the prompt box metadata row (`component/prompt/index.tsx`); other agents keep their own name.
  - `footer.model` (default `false`) / `footer.tps` (default `false`): show model name (also provider/variant in the prompt box) / tok/s in the footer; `tps` also needs `session.tps` in tui.json. Default footer is `Capri · 5.5s`.
- **Local test build**: `bun run build --single --skip-install --skip-web-ui` in `packages/cli` → `dist/cli-linux-x64/bin/opencode`, symlinked as `~/.local/bin/capri`. Rebuild to pick up changes.
- **Color theme**: add a built-in JSON in `packages/tui/src/theme/assets/` (follow existing, e.g. `cursor.json`/`dracula.json`) and register it per `theme/system.ts`/`index.ts`; token rules in `AGENTS.md` (use semantic tokens only). User-level custom themes go in `.opencode/themes/`.
- **Accent-mocking prompt**: edit/add text in `packages/core/src/plugin/system-prompt/*.txt` (one per model family — a persona must be applied to all) or via `instructions`/agent prompt in `.opencode/agent/`.
- **Naming/binary**: `packages/cli/package.json` `bin`, `bin/opencode.cjs`, build in `packages/cli/script/build.ts`.
- **Desktop GUI**: `capri.json` reaches the renderer via the main process (`packages/desktop/src/main/capri-file.ts` + IPC) into the store `@opencode/session-ui/capri` (`capri()`, `encrypt`, `agentLabel`); Capri commands and the glitch overlay live in `packages/app/src/capri/`. Guide in `capri/docs/GUI.md` (build, release workflow `.github/workflows/capri-desktop.yml`, signing, porting TUI features). App icon master `capri/desktop/icon.svg` → `bun capri/desktop/gen-icons.ts`. Package locally with `bunx electron-builder` (not `npx` on WSL). The desktop must bundle a Capri CLI via `OPENCODE_CLI_DIST`, or it ships opencode's.

## Workspace

- All customized changes should be implemented first inside `capri/` folder, and then copied and replaced the designated files. 

- A dedicated README inside `capri/` records the function of each files.

- A workspace called `capri_dev/` stores working drafts, components. Inside `.gitignore` .  

- `capri/` tracks ALL Capri-related files. Any file you create or edit for Capri, including edits to upstream opencode files, gets a copy in the matching `capri/` subfolder (`prompts/`, `glitch/`, `config/`, `logo/`, `theme/`; edited upstream files go in `upstream/` under a unique name, e.g. `session-index.tsx`), is listed in `capri/sync.sh` and recorded in `capri/README.md`, and is committed together with the change.
