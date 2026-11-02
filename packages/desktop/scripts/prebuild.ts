#!/usr/bin/env bun
import { $ } from "bun"

import { copyBuiltCliToResources, downloadCliToResources, resolveChannel } from "./utils"

const channel = resolveChannel()

if (channel === "prod" && !Bun.env.OPENCODE_CLI_DIST) {
  throw new Error("OPENCODE_CLI_DIST is required for production desktop builds")
}

await $`bun ./scripts/copy-icons.ts ${channel}`

await $`bun ./scripts/copy-metainfo.ts ${channel}`

// Capri: a supplied CLI distribution wins on every channel. The downloaded dev/beta CLIs are OpenCode's, without
// the Capri persona, so only use them for quick dev builds.
if (Bun.env.OPENCODE_CLI_DIST) await copyBuiltCliToResources(Bun.env.OPENCODE_CLI_DIST)

if (channel === "dev" && !Bun.env.OPENCODE_CLI_DIST) await downloadCliToResources()

if (channel === "beta" && !Bun.env.OPENCODE_CLI_DIST) await downloadCliToResources("beta")
