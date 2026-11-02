# Capri desktop app (Windows / macOS / Linux GUI)

How the Capri GUI is built from opencode's Electron app, how to release it, and how to carry more Capri features into
it in later versions. Introduced in v0.2.0.

## 1. What the GUI is

opencode's desktop app is three layers. Capri changes each one in a different place:

| Layer | Package | What it does | Where Capri hooks in |
|---|---|---|---|
| Shell | `packages/desktop` | Electron main process: windows, menus, installers, bundled CLI | app identity, icons, window titles, packaging |
| Renderer | `packages/app` + `packages/ui` + `packages/session-ui` | SolidJS UI in the window | theme, logo, wordmark, strings |
| Agent | the bundled `capri` CLI (`packages/cli` → `resources/opencode-cli`) | `serve --service` background server: sessions, tools, prompts | **nothing GUI-specific**: the persona and cyberpsychosis prompts live in `packages/core` and come along with the CLI |

So the persona, `/cyberpsycosis` levels (set in `capri.json`), skills and everything in `packages/core` already work in
the GUI, as long as the desktop bundles a **Capri** CLI and not opencode's (see 3.2). The TUI-only features (glitch,
masked thinking, hidden tool output, slash aliases, half-block logo) need a GUI port; see section 5.

`packages/gui-extensions` holds built-in GUI features (updater, terminal, review, browser...). Capri turns its updater
off.

## 2. What v0.2.0 changes

All files are tracked in `capri/` (see `capri/README.md` for the full table) and copied by `capri/sync.sh`.

| Area | Change | Files |
|---|---|---|
| Identity | Product name `Capri`, app id `io.github.seanyih.capri` (`.dev`/`.beta`), so it installs and stores data beside OpenCode Desktop instead of over it. Artifacts are `capri-desktop-<os>-<arch>.<ext>`. | `desktop-electron-builder.config.ts`, `desktop-constants.ts`, `desktop-copy-metainfo.ts`, `desktop-package.json` |
| Icons | App icon is the "C" of the Capri wordmark on a black tile (`capri/desktop/icon.svg`), rendered into `.icns`/`.ico`/PNGs and favicons by `capri/desktop/gen-icons.ts`. | `capri/desktop/*` |
| Theme | The default desktop theme (`oc-2`, the one used before any choice) is replaced by the Capri palette: black, pink `#FF3885`, green `#02F968`, purple `#8536C9` borders. The default color scheme is **dark**; light is a Capri day variant. | `theme/capri-desktop-theme.json`, `ui-theme-context.tsx`, `app-theme-preload.js`, `desktop-window-defaults.ts` |
| Logo | `Logo`, `Mark` and `Splash` draw the Capri wordmark / "C" (colored, or `mono` for overlays). The new-session screen shows the colored wordmark. | `logo/gui-logo.tsx`, `app-wordmark.tsx` |
| Strings | Window title, menu name, About text, crash dialogs say Capri; "Install CLI…" (macOS) installs `~/.capri/bin/capri`; Help → Report a Bug opens the Capri repo. | `desktop-window-*.ts`, `desktop-index.html`, `app-*.ts(x)`, `desktop-cli.ts`, `ui-favicon.tsx`, `ui-site.webmanifest` |
| Updater | Off. opencode's feed would replace Capri with OpenCode. | `gui-updater-main.ts`, `publish: null` in the builder config |
| Signing | Opt-in. Without certificates, macOS builds are ad-hoc signed and Windows builds are unsigned. | `desktop-electron-builder.config.ts`, `desktop-utils.ts` |
| CLI | A supplied CLI (`OPENCODE_CLI_DIST`) is used on every channel, and a `--single` build without `-baseline` is accepted. | `desktop-prebuild.ts`, `desktop-utils.ts` |
| Installer | `install` also runs on macOS (used by the desktop "Install CLI…" menu, and for `capri-darwin-*.tar.gz`). | `install/install.sh` |
| CI | `.github/workflows/capri-desktop.yml` builds everything on a `v*` tag and uploads it to a draft release. | `ci/capri-desktop.yml` |

## 3. Build locally

Needs [Bun](https://bun.sh). Run `bun install` at the root first.

### 3.1 Run from source (fastest loop)

```bash
cd packages/desktop
bun dev
```

`bun dev` runs the renderer and the CLI from source, so the Capri persona from `packages/core` is live. It uses the dev
identity (`Capri Dev`).

### 3.2 Package an installer

The desktop must bundle a **Capri** CLI. Without `OPENCODE_CLI_DIST`, the `dev` and `beta` channels download
**opencode's** CLI from npm (no persona), and `prod` refuses to build.

```bash
# 1. Build the CLI for the target (cross-compiles; any host works)
cd packages/cli
OPENCODE_VERSION=0.2.0 bun ./script/build.ts --target=opencode-linux-x64 --skip-web-ui   # or opencode-windows-x64, opencode-darwin-arm64, opencode-darwin-x64
cd ../desktop

# 2. Build the JS. `build` runs `prebuild` first, which copies icons, metainfo and the CLI into resources/
OPENCODE_CHANNEL=prod OPENCODE_CLI_DIST=$PWD/../cli/dist bun run build

# 3. Package for the current OS
OPENCODE_CHANNEL=prod bunx electron-builder --linux --publish never --config electron-builder.config.ts   # --win / --mac
```

Output lands in `packages/desktop/dist/`. Notes:

- electron-builder packages for the **host** OS. A Windows installer needs Windows (or Wine), a `.dmg` needs macOS.
  Use the CI workflow (section 4) for those.
- In a clean checkout, `bun install` rewrites `bun.lock` (it drops opencode packages this fork does not track). Don't
  commit that change unless you mean to.
- On WSL, `npx` can resolve to the Windows npm; use `bunx` or `bun --bun ./node_modules/.bin/electron-builder`.
- `bun ./scripts/prepare.ts` runs `prebuild.ts` and also writes the version into `package.json`. CI uses it;
  locally, skip it so `package.json` stays clean.
- `--linux dir` makes an unpacked app in `dist/linux-unpacked/` without building AppImage/deb/rpm (quick check).

## 4. Release (GitHub Actions)

`.github/workflows/capri-desktop.yml` (source: `capri/ci/capri-desktop.yml`):

1. `cli` job (Ubuntu) cross-compiles the Capri CLI for darwin-arm64, darwin-x64, windows-x64 and linux-x64.
2. `desktop` job runs on `macos-26` (arm64), `macos-26-intel` (x64), `windows-2025` and `ubuntu-24.04`. Each one
   archives its CLI (`capri-<os>-<arch>.tar.gz`, `capri-windows-x64.zip`, the names `install` and `install.ps1`
   download) and packages the desktop app (`.dmg` + `.zip` on macOS, NSIS `.exe` on Windows, AppImage/deb/rpm on
   Linux).
3. `release` job (tags only) uploads everything to a **draft** release for the tag.

To release v0.2.0:

```bash
git push origin main
git tag v0.2.0
git push origin v0.2.0
```

Then open the draft on GitHub, check the assets, edit the notes, and publish. To try the build without a release, run
the workflow from the Actions tab (`Run workflow`, version `0.2.0`); the artifacts are attached to the run.

The workflow only runs in `seanyih/Capri` (`if: github.repository == ...`). Change that line if the repo moves.

### Signing (optional)

Without secrets the builds work but are unsigned:

- **macOS**: ad-hoc signed. Gatekeeper blocks a downloaded app on first open. Users run
  `xattr -cr /Applications/Capri.app` once (or right-click → Open on Intel). To sign and notarize, add repository
  secrets `APPLE_CERTIFICATE` (base64 .p12 "Developer ID Application"), `APPLE_CERTIFICATE_PASSWORD`, and for
  notarization `APPLE_API_KEY_PATH` (contents of the .p8), `APPLE_API_KEY` (key id), `APPLE_API_ISSUER`. The builder
  config switches to hardened runtime + notarization when they are present.
- **Windows**: unsigned. SmartScreen shows "Windows protected your PC" → More info → Run anyway. To sign, set
  `CAPRI_WINDOWS_SIGN=true` and provide what `script/sign-windows.ps1` needs (Azure Trusted Signing: `azure/login`
  plus the `AZURE_TRUSTED_SIGNING_*` variables), as upstream's `publish.yml` does.

## 5. Extending the GUI in later versions

### 5.1 Rules (same as the CLI slice)

1. Edit in `capri/` first, then `capri/sync.sh`. A Capri-authored file goes in the matching folder (`logo/`,
   `theme/`, `desktop/`, `config/`...); an edited upstream file is snapshotted whole in `capri/upstream/` with a unique
   name (`desktop-*`, `app-*`, `ui-*`, `session-ui-*`, `gui-*` prefixes), listed in `sync.sh` and in `capri/README.md`.
2. Mark every edit in an upstream file with a `// Capri:` comment so a later upstream merge can find it.
3. Use theme tokens, never raw colors, in components (`AGENTS.md`). Raw Capri colors belong in the theme JSON and the
   logo only.
4. Test what you touch: `bun run typecheck` and `bun test <file>` in the package (`packages/desktop`, `packages/app`,
   `packages/ui`, `packages/gui-extensions`). Run tests from the package dir, never from the root.
5. Check it in the real app: `bun dev` in `packages/desktop`, or package with `--linux dir` and launch
   `dist/linux-unpacked/io.github.seanyih.capri`. For screenshots without touching your real data, launch it with
   `HOME` and `XDG_*_HOME` pointed at a scratch folder.

### 5.2 Ported features: a map

| TUI feature | GUI equivalent to build | Where to start |
|---|---|---|
| `capri.json` options | Read the same file in the **main process** (`packages/desktop/src/main`), like `packages/tui/src/capri-config.ts`, and send it to the renderer over IPC (`src/main/ipc-handlers/*`, composed in `src/main/ipc.ts`; renderer side via `window.electron` / `src/renderer/api.ts`). Expose it to `packages/app` through the platform context. Alternative: add a server endpoint in `packages/server` so the web UI gets it too. | `capri/config/capri-config.ts` (shape), `packages/desktop/src/preload` |
| `hide.thinking` (scrambled reasoning) | Reasoning parts render in `packages/session-ui`. Reuse `encrypt` from `capri/upstream/message-parts.tsx` on the reasoning text before it reaches `Markdown`. | `packages/session-ui/src/message/message-content.tsx`, `src/timeline/*` |
| `hide.toolResults` | Tool cards render in `packages/session-ui/src/tools/tool-renderer.tsx` (outputs, diffs). Drop the output body and diff views when the option is on, keep the one-line header. | `tool-renderer.tsx` |
| `hide.skills` | Filter skill-load tool rows in the timeline. | `packages/session-ui/src/timeline/timeline-row.ts` |
| `footer.name` = "Capri" | The agent label next to the model in the prompt dock / message footer. | `packages/app/src/session/*`, search for agent name rendering |
| Screen glitch (`low`+) | A CSS/canvas overlay, mounted once in the app shell, driven by the cyberpsychosis level and context use. Port the rates and shapes from `capri/glitch/glitch.ts` (pure logic, no OpenTUI) and draw with absolutely positioned divs or a `<canvas>` with `pointer-events: none`. Respect `prefers-reduced-motion`. | `packages/app/src/shell/*`, `capri/glitch/glitch.ts` |
| `/cyberpsycosis` picker | A command-palette entry + settings row that writes `capri.json` (main process) via IPC, mirroring `capri/glitch/dialog-cyberpsycosis.tsx` and `packages/core/src/capri.ts`. | `packages/app/src/shell/commands/*`, `packages/app/src/settings/*` |
| Slash aliases (`/chrome`, `/nightcity`, `/soulkiller`, `/quickhacks`) | The GUI prompt has its own `/` command list. | `packages/app/src/session/commands/use-session-commands.tsx`, `packages/app/src/session/composer/*` |
| Remaining "OpenCode" strings | `packages/app/src/runtime/i18n/en.ts` (only English is changed; other locales fall back to their own text). Leave provider names ("OpenCode Zen/Go/Console") alone: they are real services. | `en.ts`, `desktop-native.ts` |

### 5.3 Known gaps (worth fixing next)

- **Shared background service.** The desktop and the CLI both use opencode's service registry and data under
  `~/.local/state/opencode` / `~/.local/share/opencode`. If real opencode is installed too, the two apps restart each
  other's service on version mismatch. A fix is a Capri-specific state dir or service file (`client.Service.ensure({
  file })` in `packages/desktop/src/main/service/background-service.ts`, plus the CLI's matching `serve --service`).
- **URL scheme** is still `opencode://` (pairing links, deep links). Rename in `electron-builder.config.ts`
  (`protocols`), `src/main/lifecycle/environment.ts` and `src/main/lifecycle/index.ts`, and wherever the CLI prints
  such links.
- **Updates** are off. To ship them: set `publish: { provider: "github", owner: "seanyih", repo: "Capri" }`, upload
  `latest*.yml` from `dist/` with the installers, and re-enable the updater in `gui-updater-main.ts`. macOS
  auto-update needs a signed app.
- **Windows ARM64 / Linux ARM64** builds: add matrix rows (`windows-2025` + `--win --arm64`, `ubuntu-24.04-arm`) and
  the CLI targets `opencode-windows-arm64`, `opencode-linux-arm64`.
- **Help menu** still links opencode's docs and Discord (they are the docs for everything below the persona).
- Tauri-era `icons/*/android` and `icons/*/ios` folders still hold opencode art; Electron never uses them.

### 5.4 After merging upstream opencode

1. `capri/sync.sh from-repo` before editing anything in `capri/`, or the merge is overwritten by stale snapshots.
2. `git diff capri/upstream` shows what upstream changed in each file Capri touches; re-apply the `// Capri:` edits.
3. Re-run `bun capri/desktop/gen-icons.ts` only if `icon.svg` changed (icons are committed).
4. Typecheck and test the four GUI packages, package `--linux dir`, launch it, then release.
