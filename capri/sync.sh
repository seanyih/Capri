#!/usr/bin/env bash
# Keeps capri/ and the opencode tree in step.
#   sync.sh            copy capri/ into packages/ (the normal direction: edit here, then sync)
#   sync.sh from-repo  copy the Capri-authored code in packages/ back into capri/
# Prompts always go capri -> packages: each header (everything up to the first `---` line) is dropped.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
mode="${1:-to-repo}"

# capri/ file -> repo path. Whole-file copies: Capri-authored files, plus upstream files Capri has edited (those are
# snapshots, so after an opencode upstream merge run `sync.sh from-repo` before editing here, never the other way).
code=(
  "logo/logo.ts packages/tui/src/logo.ts"
  "install/install.sh install"
  "install/install.ps1 install.ps1"
  "docs/README.md README.md"
  "theme/capri-theme.json packages/tui/src/theme/assets/v2/opencode.json"
  "config/capri.ts packages/core/src/capri.ts"
  "config/capri-config.ts packages/tui/src/capri-config.ts"
  "glitch/glitch.ts packages/tui/src/glitch.ts"
  "glitch/glitch.test.ts packages/tui/test/glitch.test.ts"
  "glitch/cyber-glitch.tsx packages/tui/src/component/cyber-glitch.tsx"
  "glitch/dialog-cyberpsycosis.tsx packages/tui/src/component/dialog-cyberpsycosis.tsx"
  "logo/logo-halfblock.ts packages/tui/src/logo-halfblock.ts"
  "logo/logo-image.ts packages/tui/src/logo-image.ts"
  "upstream/session-index.tsx packages/tui/src/routes/session/index.tsx"
  "upstream/message-parts.tsx packages/tui/src/routes/session/message-parts.tsx"
  "upstream/prompt-index.tsx packages/tui/src/component/prompt/index.tsx"
  "upstream/app.tsx packages/tui/src/app.tsx"
  "upstream/prompt-footer.tsx packages/tui/src/feature-plugins/prompt/footer.tsx"
  "upstream/keybind.ts packages/tui/src/config/keybind.ts"
  "upstream/attention.ts packages/tui/src/attention.ts"
  "upstream/mini-runtime-lifecycle.ts packages/tui/src/mini/runtime.lifecycle.ts"
  "upstream/cli-default.ts packages/cli/src/commands/handlers/default.ts"
  "upstream/permission.tsx packages/tui/src/routes/session/permission.tsx"
  "upstream/mini-footer-permission.tsx packages/tui/src/mini/footer.permission.tsx"
  "upstream/error-component.tsx packages/tui/src/component/error-component.tsx"
  "upstream/terminal-pane.tsx packages/tui/src/component/terminal-pane.tsx"
  "upstream/mini-footer-prompt.tsx packages/tui/src/mini/footer.prompt.tsx"
  "upstream/error-details.ts packages/tui/src/util/error-details.ts"
  "upstream/tui-config-index.tsx packages/tui/src/config/index.tsx"
  "upstream/sidebar-footer.tsx packages/tui/src/feature-plugins/sidebar/footer.tsx"
  "upstream/dialog-pair.tsx packages/tui/src/component/dialog-pair.tsx"
  "upstream/tui-error.ts packages/tui/src/util/error.ts"
  "upstream/mini-splash.ts packages/tui/src/mini/splash.ts"
  "upstream/cli-commands.ts packages/cli/src/commands/commands.ts"
  "upstream/cli-pair.ts packages/cli/src/commands/handlers/pair.ts"
  "upstream/cli-uninstall.ts packages/cli/src/commands/handlers/uninstall.ts"
  "upstream/cli-upgrade.ts packages/cli/src/commands/handlers/upgrade.ts"
  "upstream/cli-stats.ts packages/cli/src/commands/handlers/stats.ts"
  "upstream/cli-acp-handler.ts packages/cli/src/commands/handlers/acp.ts"
  "upstream/cli-mcp-auth.ts packages/cli/src/commands/handlers/mcp/auth.ts"
  "upstream/cli-acp-service.ts packages/cli/src/acp/service.ts"
  "upstream/cli-acp-error.ts packages/cli/src/acp/error.ts"
  "upstream/cli-acp-translate.ts packages/cli/src/acp/translate.ts"
  "upstream/cli-mini.ts packages/cli/src/mini.ts"
  "upstream/cli-mini-host.ts packages/cli/src/mini-host.ts"
  "upstream/cli-server-process.ts packages/cli/src/server-process.ts"
  "upstream/cli-remote-tunnel.ts packages/cli/src/services/remote-tunnel.ts"
  "upstream/cli-build.ts packages/cli/script/build.ts"
  "skills/cyberpunk-lore/SKILL.md .opencode/skills/cyberpunk-lore/SKILL.md"
  "skills/cyberpunk-lore/references/characters.md .opencode/skills/cyberpunk-lore/references/characters.md"
  "skills/cyberpunk-lore/references/factions.md .opencode/skills/cyberpunk-lore/references/factions.md"
  "skills/cyberpunk-lore/references/places.md .opencode/skills/cyberpunk-lore/references/places.md"
  "skills/cyberpunk-lore/references/tech.md .opencode/skills/cyberpunk-lore/references/tech.md"
  "skills/cyberpunk-lore/references/timeline.md .opencode/skills/cyberpunk-lore/references/timeline.md"
  "skills/cyberpunk-lore/references/slang.md .opencode/skills/cyberpunk-lore/references/slang.md"
  "tests/capri-settings.ts packages/tui/test/fixture/capri-settings.ts"
  "tests/app-lifecycle.test.tsx packages/tui/test/app-lifecycle.test.tsx"
  "tests/command-selection.test.tsx packages/tui/test/command-selection.test.tsx"
  "tests/compact-admission.test.tsx packages/tui/test/compact-admission.test.tsx"
  "tests/new-session-id.test.tsx packages/tui/test/new-session-id.test.tsx"
  "tests/prompt-shell-failure.test.tsx packages/tui/test/prompt-shell-failure.test.tsx"
  "tests/session-panel.test.tsx packages/tui/test/session-panel.test.tsx"
  "tests/session-backfill-disclosure.test.tsx packages/tui/test/session-backfill-disclosure.test.tsx"
  "tests/session-group-navigation.test.tsx packages/tui/test/session-group-navigation.test.tsx"
  "tests/session-activity-anchor.test.tsx packages/tui/test/session-activity-anchor.test.tsx"
  "tests/group-view.test.tsx packages/tui/test/cli/tui/group-view.test.tsx"
  # GUI (desktop app): Capri-authored files
  "logo/gui-logo.tsx packages/ui/src/components/logo.tsx"
  "theme/capri-desktop-theme.json packages/ui/src/theme/themes/oc-2.json"
  "ci/capri-desktop.yml .github/workflows/capri-desktop.yml"
  "desktop/favicon/favicon-v3.svg packages/ui/src/assets/favicon/favicon-v3.svg"
  "desktop/favicon/favicon-v3.ico packages/ui/src/assets/favicon/favicon-v3.ico"
  "desktop/favicon/favicon-96x96-v3.png packages/ui/src/assets/favicon/favicon-96x96-v3.png"
  "desktop/favicon/apple-touch-icon-v3.png packages/ui/src/assets/favicon/apple-touch-icon-v3.png"
  "desktop/favicon/web-app-manifest-192x192.png packages/ui/src/assets/favicon/web-app-manifest-192x192.png"
  "desktop/favicon/web-app-manifest-512x512.png packages/ui/src/assets/favicon/web-app-manifest-512x512.png"
  # GUI: edited upstream files
  "upstream/app-wordmark.tsx packages/app/src/new-session/wordmark.tsx"
  "upstream/ui-theme-context.tsx packages/ui/src/theme/context.tsx"
  "upstream/app-theme-preload.js packages/app/public/oc-theme-preload.js"
  "upstream/desktop-window-defaults.ts packages/desktop/src/main/windows/defaults.ts"
  "upstream/desktop-window-appearance.ts packages/desktop/src/main/windows/appearance.ts"
  "upstream/desktop-window-early.ts packages/desktop/src/main/windows/early.ts"
  "upstream/desktop-index.html packages/desktop/src/renderer/index.html"
  "upstream/app-windows-menu.tsx packages/app/src/shell/titlebar/windows-menu.tsx"
  "upstream/ui-favicon.tsx packages/ui/src/components/favicon.tsx"
  "upstream/ui-site.webmanifest packages/ui/src/assets/favicon/site.webmanifest"
  "upstream/app-desktop-menu.ts packages/app/src/shell/commands/desktop-menu.ts"
  "upstream/app-desktop-native.ts packages/app/src/runtime/i18n/desktop-native.ts"
  "upstream/app-i18n-en.ts packages/app/src/runtime/i18n/en.ts"
  "upstream/desktop-cli.ts packages/desktop/src/main/service/desktop-cli.ts"
  "upstream/desktop-constants.ts packages/desktop/src/main/constants.ts"
  "upstream/gui-updater-main.ts packages/gui-extensions/src/updater/main.ts"
  "upstream/desktop-electron-builder.config.ts packages/desktop/electron-builder.config.ts"
  "upstream/desktop-electron-builder.config.test.ts packages/desktop/electron-builder.config.test.ts"
  "upstream/desktop-copy-metainfo.ts packages/desktop/scripts/copy-metainfo.ts"
  "upstream/desktop-utils.ts packages/desktop/scripts/utils.ts"
  "upstream/desktop-prebuild.ts packages/desktop/scripts/prebuild.ts"
  "upstream/desktop-package.json packages/desktop/package.json"
  "tests/ui-theme-v2-resolve.test.ts packages/ui/src/theme/v2/resolve.test.ts"
)
for entry in "${code[@]}"; do
  read -r name target <<<"$entry"
  if [ "$mode" = "from-repo" ]; then mkdir -p "$(dirname "$root/capri/$name")" && cp "$root/$target" "$root/capri/$name"; else mkdir -p "$(dirname "$root/$target")" && cp "$root/capri/$name" "$root/$target"; fi
done
[ "$mode" = "from-repo" ] && exit 0

# Desktop app icons (rendered by desktop/gen-icons.ts) go to every channel; the folders also keep opencode's unused
# Tauri-era android/ and ios/ icons.
for channel in dev beta prod; do
  cp "$root"/capri/desktop/icons/* "$root/packages/desktop/icons/$channel/"
done

dest="$root/packages/core/src/session/runner/prompt/capri"
mkdir -p "$dest"
strip() { awk 'found { print } /^---$/ && !found { found = 1 }' "$1" | sed '1{/^$/d}'; }
strip "$root/capri/prompts/CAPRI.md" > "$dest/persona.txt"
for level in none low medium max; do
  strip "$root/capri/prompts/cyberpsycosis-$level.md" > "$dest/cyberpsycosis-$level.txt"
done
