import { app } from "electron"

type Channel = "local" | "dev" | "beta" | "prod"

const raw = import.meta.env.OPENCODE_CHANNEL

export const CHANNEL: Channel = raw === "local" || raw === "dev" || raw === "beta" || raw === "prod" ? raw : "dev"

export const VERSION = app.isPackaged ? app.getVersion() : (process.env.OPENCODE_VERSION ?? app.getVersion())

// Capri: its own names and app ids, so it installs and stores data beside OpenCode Desktop, not over it.
// Keep in sync with APP_IDS / productName in electron-builder.config.ts.
const appNames: Record<string, string> = {
  dev: "Capri Dev",
  beta: "Capri Beta",
  prod: "Capri",
}

const appIDs: Record<string, string> = {
  dev: "io.github.seanyih.capri.dev",
  beta: "io.github.seanyih.capri.beta",
  prod: "io.github.seanyih.capri",
}

// Local renderer/server mode keeps the dev application identity.
export const APP_NAME = app.isPackaged ? appNames[CHANNEL] : "Capri Dev"

export const APP_ID = app.isPackaged ? appIDs[CHANNEL] : "io.github.seanyih.capri.dev"
