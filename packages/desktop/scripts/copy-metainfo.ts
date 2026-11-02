import { resolveChannel } from "./utils"

const arg = process.argv[2]

const channel = arg === "dev" || arg === "beta" || arg === "prod" ? arg : resolveChannel()

// Capri: app id and names match electron-builder.config.ts.
const appId = channel === "prod" ? "io.github.seanyih.capri" : `io.github.seanyih.capri.${channel}`

const productName = channel === "prod" ? "Capri" : `Capri ${channel.charAt(0).toUpperCase() + channel.slice(1)}`

const summary = `Cyberpunk AI coding agent${channel !== "prod" ? ` (${channel})` : ""}`

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${appId}</id>

  <metadata_license>CC0-1.0</metadata_license>
  <project_license>MIT</project_license>

  <name>${productName}</name>
  <summary>${summary}</summary>

  <developer id="io.github.seanyih">
    <name>seanyih</name>
  </developer>

  <description>
    <p>
      Capri is a fork of OpenCode, the open source agent that helps you write and run code with any AI model,
      reskinned after Capri from Cyberpunk: Edgerunners.
    </p>
  </description>

  <launchable type="desktop-id">${appId}.desktop</launchable>

  <content_rating type="oars-1.1" />

  <url type="bugtracker">https://github.com/seanyih/Capri/issues</url>
  <url type="homepage">https://github.com/seanyih/Capri</url>
  <url type="vcs-browser">https://github.com/seanyih/Capri</url>
</component>
`

await Bun.write(`resources/${appId}.metainfo.xml`, xml)

console.log(`Generated metainfo for ${channel} at resources/${appId}.metainfo.xml`)
