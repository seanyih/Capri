#!/usr/bin/env bash
# Capri installer (Linux and macOS). Installs the binary as `capri`, seeds ~/.config/capri/capri.json and installs Capri's skills.
set -euo pipefail
APP=capri
REPO=seanyih/Capri

MUTED='\033[0;2m'
RED='\033[0;31m'
MAGENTA='\033[38;5;201m'
GREEN='\033[38;5;48m'
NC='\033[0m'

usage() {
    cat <<USAGE
Capri Installer

Usage: install [options]

Options:
    -h, --help              Display this help message
    -v, --version <tag>     Install a specific release (e.g., v0.1.0)
    -b, --binary <path>     Install from a local binary instead of downloading
        --no-modify-path    Don't modify shell config files (.zshrc, .bashrc, etc.)

Examples:
    curl -fsSL https://raw.githubusercontent.com/$REPO/main/install | bash
    curl -fsSL https://raw.githubusercontent.com/$REPO/main/install | bash -s -- --version v0.1.0
    ./install --binary packages/cli/dist/cli-linux-x64/bin/opencode
USAGE
}

requested_version=${VERSION:-}
no_modify_path=false
binary_path=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--version)
            if [[ -n "${2:-}" ]]; then
                requested_version="$2"
                shift 2
            else
                echo -e "${RED}Error: --version requires a version argument${NC}"
                exit 1
            fi
            ;;
        -b|--binary)
            if [[ -n "${2:-}" ]]; then
                binary_path="$2"
                shift 2
            else
                echo -e "${RED}Error: --binary requires a path argument${NC}"
                exit 1
            fi
            ;;
        --no-modify-path)
            no_modify_path=true
            shift
            ;;
        *)
            echo -e "${MAGENTA}Warning: Unknown option '$1'${NC}" >&2
            shift
            ;;
    esac
done

case "$(uname -s)" in
    Linux) os="linux" ;;
    Darwin) os="darwin" ;;
    *)
        echo -e "${RED}This installer is for Linux and macOS. On Windows use install.ps1 (see the README).${NC}"
        exit 1
        ;;
esac

INSTALL_DIR=$HOME/.capri/bin
mkdir -p "$INSTALL_DIR"

if [ -n "$binary_path" ]; then
    if [ ! -f "$binary_path" ]; then
        echo -e "${RED}Error: Binary not found at ${binary_path}${NC}"
        exit 1
    fi
else
    arch=$(uname -m)
    case "$arch" in
        x86_64) arch="x64" ;;
        aarch64|arm64) arch="arm64" ;;
        *)
            echo -e "${RED}Unsupported architecture: $arch${NC}"
            exit 1
            ;;
    esac

    target="$os-$arch"
    if [ "$os" = "linux" ]; then
        if [ "$arch" = "x64" ] && ! grep -qwi avx2 /proc/cpuinfo 2>/dev/null; then
            target="$target-baseline"
        fi
        if [ -f /etc/alpine-release ] || { command -v ldd >/dev/null 2>&1 && ldd --version 2>&1 | grep -qi musl; }; then
            target="$target-musl"
        fi
    fi

    for tool in curl tar; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            echo -e "${RED}Error: '$tool' is required but not installed.${NC}"
            exit 1
        fi
    done

    filename="$APP-$target.tar.gz"
    if [ -z "$requested_version" ]; then
        url="https://github.com/$REPO/releases/latest/download/$filename"
    else
        url="https://github.com/$REPO/releases/download/v${requested_version#v}/$filename"
    fi
fi

install_binary() {
    local source=$1
    # Write beside the target, then rename: replacing a running binary in place fails with "text file busy".
    cp "$source" "$INSTALL_DIR/$APP.new"
    chmod 755 "$INSTALL_DIR/$APP.new"
    mv -f "$INSTALL_DIR/$APP.new" "$INSTALL_DIR/$APP"
}

if [ -n "$binary_path" ]; then
    echo -e "\n${MUTED}Jacking in from: ${NC}$binary_path"
    install_binary "$binary_path"
else
    echo -e "\n${MUTED}Downloading ${NC}$filename ${MUTED}from ${NC}github.com/$REPO"
    tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/capri_install.XXXXXX")
    trap 'rm -rf "$tmp_dir"' EXIT
    if ! curl -fL -# -o "$tmp_dir/$filename" "$url"; then
        echo -e "${RED}Download failed: $url${NC}"
        echo -e "${MUTED}No release for $target yet? Build from source (see the README) and use --binary.${NC}"
        exit 1
    fi
    tar -xzf "$tmp_dir/$filename" -C "$tmp_dir"
    if [ ! -f "$tmp_dir/$APP" ]; then
        echo -e "${RED}Release archive has no '$APP' binary inside.${NC}"
        exit 1
    fi
    install_binary "$tmp_dir/$APP"
fi

# Default Capri settings. An existing file is the user's and is never touched.
XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-$HOME/.config}
CONFIG_DIR=$XDG_CONFIG_HOME/capri
CONFIG_FILE=$CONFIG_DIR/capri.json
mkdir -p "$CONFIG_DIR"
if [ -e "$CONFIG_FILE" ]; then
    echo -e "${MUTED}Keeping your existing ${NC}$CONFIG_FILE"
else
    cat > "$CONFIG_FILE" <<'CONFIG'
{
  // Capri settings (jsonc). Restart Capri to apply changes.
  // Env vars override these per launch: CAPRI_LOGO, CAPRI_CYBERPSYCOSIS.

  // none | low | medium | max. Also switchable in the TUI with /cyberpsycosis.
  "cyberpsycosis": "none",

  // Screen glitch rate multiplier: 1 = normal, 0 = off, 2 = double (max 10).
  "glitchProbability": 1,

  "logo": {
    // auto | image | quadrant | halfblock
    "style": "auto"
  },

  "hide": {
    // Show the model's reasoning as scrambled glyphs.
    "thinking": true,
    // Hide tool output, diffs and diagnostics.
    "toolResults": true,
    // Hide the lines that show a skill being loaded.
    "skills": true
  },

  "footer": {
    // Label for the default agent in the reply footer.
    "name": "Capri",
    // Show the model name in the footer and prompt box.
    "model": false,
    // Show tokens per second (also needs session.tps in tui.json).
    "tps": false
  }
}
CONFIG
    echo -e "${MUTED}Wrote default settings to ${NC}$CONFIG_FILE"
fi

# Capri skills go in the global skills dir, so they work from any project. They are Capri's own, so a rerun refreshes
# them. From a checkout they are copied from capri/skills; otherwise they are fetched from the repo (the tag when
# --version is given, else main). A failure here never fails the install.
SKILLS_DIR=${OPENCODE_CONFIG_DIR:-$XDG_CONFIG_HOME/opencode}/skills
SKILL_FILES="cyberpunk-lore/SKILL.md cyberpunk-lore/references/characters.md cyberpunk-lore/references/factions.md
cyberpunk-lore/references/places.md cyberpunk-lore/references/tech.md cyberpunk-lore/references/timeline.md
cyberpunk-lore/references/slang.md"
install_skills() {
    local src
    src="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)/capri/skills"
    local ref=main
    [ -n "$requested_version" ] && ref="v${requested_version#v}"
    local file
    for file in $SKILL_FILES; do
        mkdir -p "$SKILLS_DIR/$(dirname "$file")"
        if [ -f "$src/$file" ]; then
            cp "$src/$file" "$SKILLS_DIR/$file"
        elif command -v curl >/dev/null 2>&1; then
            curl -fsSL -o "$SKILLS_DIR/$file.tmp" "https://raw.githubusercontent.com/$REPO/$ref/capri/skills/$file" \
                && mv -f "$SKILLS_DIR/$file.tmp" "$SKILLS_DIR/$file" || { rm -f "$SKILLS_DIR/$file.tmp"; return 1; }
        else
            return 1
        fi
    done
}
if install_skills; then
    echo -e "${MUTED}Installed skills to ${NC}$SKILLS_DIR"
else
    echo -e "${MAGENTA}Warning: could not install Capri skills (offline?). Capri works without them.${NC}" >&2
fi

path_added=false
add_to_path() {
    local config_file=$1
    local command=$2

    if grep -Fxq "$command" "$config_file"; then
        echo -e "Command already exists in $config_file, skipping write."
    elif [[ -w $config_file ]]; then
        echo -e "\n# capri" >> "$config_file"
        echo "$command" >> "$config_file"
        path_added=true
        echo -e "${MUTED}Added ${NC}capri ${MUTED}to \$PATH in ${NC}$config_file"
    else
        echo -e "Manually add the directory to $config_file (or similar):"
        echo -e "  $command"
    fi
}

current_shell=$(basename "${SHELL:-bash}")
case $current_shell in
    fish)
        config_files="$HOME/.config/fish/config.fish"
    ;;
    zsh)
        config_files="${ZDOTDIR:-$HOME}/.zshrc ${ZDOTDIR:-$HOME}/.zshenv $XDG_CONFIG_HOME/zsh/.zshrc $XDG_CONFIG_HOME/zsh/.zshenv"
    ;;
    ash|sh)
        config_files="$HOME/.ashrc $HOME/.profile /etc/profile"
    ;;
    *)
        config_files="$HOME/.bashrc $HOME/.bash_profile $HOME/.profile $XDG_CONFIG_HOME/bash/.bashrc $XDG_CONFIG_HOME/bash/.bash_profile"
    ;;
esac

if [[ "$no_modify_path" != "true" && ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    config_file=""
    for file in $config_files; do
        if [[ -f $file ]]; then
            config_file=$file
            break
        fi
    done

    if [[ -z $config_file ]]; then
        echo -e "No config file found for $current_shell. Add this to your shell config:"
        echo -e "  export PATH=$INSTALL_DIR:\$PATH"
    elif [[ $current_shell == fish ]]; then
        add_to_path "$config_file" "fish_add_path $INSTALL_DIR"
    else
        add_to_path "$config_file" "export PATH=$INSTALL_DIR:\$PATH"
    fi
fi

echo -e ""
echo -e "${MAGENTA} Capri is online. Wake up, netrunner.${NC}"
echo -e ""
if [[ $path_added == "true" ]]; then
    echo -e "exec \$SHELL   ${MUTED}# Reload PATH (or open a new terminal)${NC}"
fi
echo -e "cd <project>  ${MUTED}# Open directory${NC}"
echo -e "capri         ${MUTED}# Jack in${NC}"
echo -e ""
echo -e "${MUTED}Settings: ${NC}$CONFIG_FILE"
echo -e ""
