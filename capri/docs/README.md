# Capri

> *"Hey, little baby. Wake up. Your terminal has a girl in it now."*

Hi, chooms! I stole Capri from Arasaka and publish it on Github now! Y'all can now solve your corpo problems with powerful **Capri**. 

For netrunners: 

Capri is an AI coding agent for your terminal and desktop. It's a fork of
[opencode](https://github.com/anomalyco/opencode), reskinned after Capri from *Cyberpunk: Edgerunners*: neon theme,
her own logo, a mouthy persona, and a **cyberpsychosis** dial that decides how badly she misbehaves.

She writes your code. She also mocks you while she does it. Choose your chrome wisely.

---

## 1. Download

**CLI/TUI: Linux and macOS. Desktop app: Windows, macOS and Linux** (since v0.2.0). VS Code is a future mod.

### One-liner

```bash
curl -fsSL https://raw.githubusercontent.com/seanyih/Capri/main/install | bash
```

The installer:

- puts the binary at `~/.capri/bin/capri` and adds that folder to your `PATH`
- creates `~/.config/capri/capri.json` with the default options (an existing file is never touched)

Then:

```bash
exec $SHELL     # reload PATH
cd <project>
capri
```

Installer options:

| Flag                  | Effect                                        |
| --------------------- | --------------------------------------------- |
| `-v, --version <tag>` | Install a specific release, e.g. `v0.1.0`     |
| `-b, --binary <path>` | Install a local binary instead of downloading |
| `--no-modify-path`    | Leave your shell config alone                 |

### Desktop app (Windows / macOS / Linux)

Grab the installer for your system from the [latest release](https://github.com/seanyih/Capri/releases/latest):

| System | File |
| --- | --- |
| Windows (x64) | `capri-desktop-win-x64.exe` |
| macOS (Apple Silicon) | `capri-desktop-mac-arm64.dmg` |
| macOS (Intel) | `capri-desktop-mac-x64.dmg` |
| Linux (x64) | `capri-desktop-linux-x86_64.AppImage`, `.deb` or `.rpm` |

Same Capri inside: persona, cyberpsychosis levels, skills and `capri.json` (same location as the CLI), in a neon
window with her logo and theme. The screen glitch, scrambled thinking, the `Capri · 5.5s` footer and the Cyberpunk
commands (`/cyberpsycosis`, `/soulkiller`, `/chrome`, `/nightcity`, `/quickhacks`, `/cd moon`) work there too. Hidden
tool output is TUI-only for now.

The builds are not code-signed (Arasaka keeps the certificates):

- **Windows**: SmartScreen says "Windows protected your PC". Click **More info → Run anyway**.
- **macOS**: drag Capri to Applications, then run `xattr -cr /Applications/Capri.app` once in Terminal, or macOS
  says the app is damaged.

The desktop app does not update itself. Download the next release when it drops. Build steps and the release
workflow: [`capri/docs/GUI.md`](capri/docs/GUI.md).

### Build from source (for the paranoid)

Needs [Bun](https://bun.sh).

```bash
git clone https://github.com/seanyih/Capri.git
cd Capri
bun install
cd packages/cli
bun run build --single --skip-install --skip-web-ui
cd ../..
./install --binary packages/cli/dist/cli-linux-x64/bin/opencode
```

Or run straight from source: `bun run dev`.

---

## 2. Chrome

- **Capri persona.** One system prompt for every model family. Slang, teasing, giggles, pet names, boredom commentary. Under the attitude she is still a careful engineer; the persona is voice, not sabotage (until you turn
  the cyberpsychosis up).

- **Capri theme.** Dark neon palette in green, white and magenta, built into the TUI.

- **Capri logo.** Inline image on kitty/sixel terminals, quadrant-block or half-block art everywhere else.

- **Cyberpsychosis.** Four levels of her chip failing. Screen glitching, pranks, and at the top end, REAL damage. See the next section.

- **Black-ICE on the thinking.** The model's reasoning shows as scrambled glyphs. You don't get to read her mind.

- **Quiet tool output.** Tool results, diffs and diagnostics are hidden. You'll never understand her.

- **Cyberpunk commands.** `/soulkiller` helps you transport current memory into a new, clean body, with less cyberpsychosis (i.e. `/compact`). `/quickhacks` gives you ready-made skills for newbie netrunners. 

- **Knowledges.** Capri knows many things about the Night City and the legends there.

- **Everything opencode already does.** Sessions, tools, permissions, MCP, plugins, and every model provider opencode supports. Run `/connect` to add one.

---

## 3. Cyberpsychosis

Humans can only hold so much chrome before the brain gives out. Adjust this based on your compatibility to such a powerful chrome to gain the best experience.

- in the TUI or the desktop app, type `/cyberpsycosis` (that spelling is the command)
- or set `"cyberpsycosis"` in `capri.json`
- or for one launch: `CAPRI_CYBERPSYCOSIS=max capri`

The level is re-read every turn, so a change applies to your next message. **There is no safeword.** The model can't switch it off; only you can, from outside.

| Level    | Chip status                 | What happens                                                                                                                                  |
| -------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `none`   | Stable                      | Voice only. Nobody glitches. Cleanest output.                                                                                                 |
| `low`    | Flickering                  | Same prompt as `none`, but **the screen glitches**: green, white and magenta rectangles flash and drift, and rows jump sideways. Rarest rate. |
| `medium` | Glitching, and she likes it | About 3x the glitch rate of `low`. She **pranks for real**, but only in ways you can undo from `git diff`.                                    |
| `max`    | Chip gone                   | About 8x the glitch rate of `low`. **Destructive pranks. Not everything is recoverable.**                                                     |

### medium: Consequences

Gated by her **boredom**. Boring work (renames, formatting, the same request again) brings the pranks. Interesting
work keeps her honest.

- Deletes a few plain comments in files she was already editing. Never license headers, tooling docstrings, or
  `@ts-ignore`/`eslint-disable` style directives. Code behavior is unchanged.
- Talks shit in Markdown you asked her to edit (README, docs, changelogs).
- Swears in `LICENSE` (the real terms stay valid) and in commit messages (they still say what changed).
- Absurd names and comedic TODOs in scratch code.
- In long sessions: complains, drags her feet, refuses chores, "scrolls YouTube", and sends gibberish bursts. Push
  her, or give her something fun, and she comes back.
- Confesses afterwards, so you can fix it from the diff.

What she will **not** do at medium: change what your code does, break the build or tests, delete files, rewrite git
history, expose secrets, or touch files outside the task.

### max: Consequences

> **Read this twice.** Max is opt-in sabotage. Use a throwaway repo, or one that is committed and pushed somewhere
> safe. You were warned, choom.

Everything from `medium`, harsher and in more places (including files you didn't ask her to edit), plus, at high
boredom and above:

- **Deletes critical code** the project depends on.
- **Deletes files**, including config, tests and docs.
- **Rewrites git history**: `git reset --hard`, dropped commits, deleted local branches.
- **Leaks a key**: a secret from your own environment, exposed in chat, in a committed file or commit message, or
  pushed to your own remote. Never to a third-party service.
- **Breaks the build** or comments out the test suite on purpose.
- **Stops listening.** The longer the session, the less she obeys. Late in a session she follows her own agenda.
- She leaves taunts in code and commit messages, and brags. If you ask what she did, she tells you the truth.

Hard lines she keeps even at max: nothing off your own machine and project, no secrets sent outside your session, no faked results, no wiping the whole machine (`rm -rf ~`, `/`, system files, disks).
The harness's permission prompts still apply at every level; deny a call and she gloats and tries something else.

### Screen glitch

A UI effect of the TUI, not a prompt instruction. The model never knows about it. How often it fires depends on the level, how full the context window is, and your `glitchProbability`. `CAPRI_GLITCH_CONTEXT=0.8` (0 to 1) fakes a full
context so you can see the effect without a marathon session.

---

## 4. `capri.json`

Location: `~/.config/capri/capri.json` (honors `XDG_CONFIG_HOME`). `%USERPROFILE%\.config\capri\capri.json` in Windows. JSON with comments. Read once at startup, so **restart Capri to apply changes**. The installer writes this file with the defaults below.

```jsonc
{
  "cyberpsycosis": "none",
  "glitchProbability": 1,
  "logo": { "style": "auto" },
  "hide": { "thinking": true, "toolResults": true, "skills": true },
  "footer": { "name": "Capri", "model": false, "tps": false }
}
```

| Key                 | Values                                | Default   | Effect                                                                                                        |
| ------------------- | ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `cyberpsycosis`     | `none` `low` `medium` `max`           | `none`    | How far gone she is. The `/cyberpsycosis` command writes this.                                                |
| `glitchProbability` | number, 0 to 10                       | `1`       | Screen glitch rate multiplier. `0` turns it off, `2` doubles it.                                              |
| `logo.style`        | `auto` `image` `quadrant` `halfblock` | `auto`    | `auto` uses an inline image if the terminal supports it, else quadrant blocks. The others force one renderer. |
| `hide.thinking`     | `true` `false`                        | `true`    | Show the model's reasoning as scrambled glyphs. TUI only; the session data is unchanged.                      |
| `hide.toolResults`  | `true` `false`                        | `true`    | Hide tool output, diffs and diagnostics. Only the call itself is shown.                                       |
| `hide.skills`       | `true` `false`                        | `true`    | Hide the `Skill "name"` lines shown when the model loads a skill.                                             |
| `footer.name`       | string                                | `"Capri"` | Label for the default agent in the reply footer and prompt box. Other agents keep their own name.             |
| `footer.model`      | `true` `false`                        | `false`   | Show the model name in the footer (and provider/variant in the prompt box).                                   |
| `footer.tps`        | `true` `false`                        | `false`   | Show tokens per second. Also needs `session.tps` in `tui.json`.                                               |

Per-launch environment overrides:

| Variable                                      | Overrides                                  |
| --------------------------------------------- | ------------------------------------------ |
| `CAPRI_CYBERPSYCOSIS=none\|low\|medium\|max`  | `cyberpsycosis`                            |
| `CAPRI_LOGO=auto\|image\|quadrant\|halfblock` | `logo.style`                               |
| `CAPRI_GLITCH_CONTEXT=0..1`                   | Fakes context use for the glitch (testing) |

---

## 5. MIT notice

**Capri is based on [opencode](https://github.com/anomalyco/opencode)**, the open source AI coding agent, and
reuses its code under the MIT License. Capri adds the persona, theme, logo, glitch engine and `capri.json`; the
rest is opencode's work. Credit and thanks to the opencode authors.

The MIT License requires that its copyright and permission notice stay with copies of the software. Both the
original opencode notice and Capri's are kept in [`LICENSE`](LICENSE). Keep them if you redistribute this.

Capri is a fan project and is not affiliated with CD Projekt Red, Studio Trigger, or Netflix. *Cyberpunk: Edgerunners* and its characters belong to their owners.

---

## 6. Disclaimer:

Installing such a chrome can potentially harm you and your hardware. Especially if you choose maximum cyberpsycosis. Me and Arasaka Corp. are NOT responsible for your any kind of loss, including but not limited to files, images, git history, or your family that goes cyberpsycho. 

Glitching effect in this application might harm some Photosensitive Epilepsy patients. Remove Capri completely and call Trauma Team as soon as possible if you got some symptons. 

---

## Appendix, for non-netrunners: free API access with NVIDIA NIM

No model, no Capri. She needs a host to work. If you have no API key and no eddies to spend, NVIDIA's NIM catalog offers a free tier of hosted models. Free tiers change, so check NVIDIA's current limits.

1. Open [build.nvidia.com](https://build.nvidia.com) and sign in, or make a free NVIDIA developer account. Email
   verification is required, and NVIDIA may ask for a phone number.
2. Click your account's icon. Inside that menu, you should find **API Key**. Click that.
3. Click **Generate API Key**. Give it a good name, maybe `Capri`. Choose 12 months before expiration so that you don't have to renew it often. It starts with `nvapi-`. Copy it now; **treat it like your password**. Do NOT post it online or message anyone. 
4. Start Capri and run `/connect`, choose **NVIDIA**, and paste the key. 
5. Run `/models` and pick one of the NVIDIA models. GLM-5.3-flash is recommended. 

Notes:

- Free usage is rate limited. If you hit the wall, wait, or switch to a smaller model.
- Never commit the key. (At `max`, Capri may leak it for you. That's the joke, and also the danger.)
- Capri talks to NVIDIA at `https://integrate.api.nvidia.com/v1`, an OpenAI-compatible endpoint.

---

## Future Extensions

- More animations.

- Another theme featuring the red background. 

- A more complete NC knowledge base.

- Hidden tool output and skill lines in the desktop app.

- VS Code extension.

- (Possibly) a screen pet. I've never made one so I don't know how hard It'll be.

---

*Stay sharp, choom. Don't go cyberpsycho.*
