import { execFile } from "node:child_process"
import { readdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import type { CustomMacSignOptions } from "app-builder-lib"
import { Arch, type Configuration } from "electron-builder"
import { NativeArch } from "../../script/native-arch"
import { CLI_BINARIES, getCurrentCli, nodePtyPackage } from "./scripts/utils"

const execFileAsync = promisify(execFile)

const packageDir = path.dirname(fileURLToPath(import.meta.url))

const rootDir = path.resolve(packageDir, "../..")

const signScript = path.join(rootDir, "script", "sign-windows.ps1")

// rpmbuild adds /usr/lib/.build-id links for every ELF file. The bundled Electron
// binaries are byte-identical across apps on the same Electron version, so those
// links collide with other Electron RPMs (Slack, Unity Hub, ...) and rpm/zypper
// refuse to install or update. They only serve debuginfo lookup, so skip them.
// fpm only accepts flags before the first src=dest mapping, so keep this first.
const rpmNoBuildIdLinksFpm = "--rpm-rpmbuild-define=_build_id_links none"

const metainfoFpm = (appId: string) =>
  `${path.join(packageDir, "resources", `${appId}.metainfo.xml`)}=/usr/share/metainfo/${appId}.metainfo.xml`

// Capri: signing needs certificates the fork does not have, so it is opt-in. Windows signs only with
// CAPRI_WINDOWS_SIGN=true (script/sign-windows.ps1, Azure Trusted Signing); macOS signs with a real identity
// when CSC_LINK/CSC_NAME/CSC_KEYCHAIN is set and notarizes when Apple credentials are set, else it is ad-hoc
// signed ("-") so Apple Silicon still runs it (users clear quarantine once, see capri/docs/GUI.md).
const macIdentity = Boolean(process.env.CSC_LINK || process.env.CSC_NAME || process.env.CSC_KEYCHAIN)

const macNotarize = macIdentity && Boolean(process.env.APPLE_API_KEY || process.env.APPLE_ID)

async function signWindows(configuration: { path: string }) {
  if (process.platform !== "win32") return

  if (process.env.GITHUB_ACTIONS !== "true" || process.env.CAPRI_WINDOWS_SIGN !== "true") return

  await execFileAsync(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", signScript, configuration.path],
    { cwd: rootDir, windowsHide: true },
  )
}

function macSignOptions(options: CustomMacSignOptions): CustomMacSignOptions {
  return {
    ...options,
    optionsForFile: (file) => {
      const defaults = options.optionsForFile?.(file)

      if (file !== path.join(options.app, "Contents/Resources/opencode-cli")) return defaults ?? {}

      // The Bun CLI loads bun-pty's native library; Electron and its helpers do not need this exception.
      return { ...defaults, entitlements: path.join(packageDir, "resources/entitlements.cli.plist") }
    },
  }
}

function resolveChannel() {
  const raw = process.env.OPENCODE_CHANNEL

  if (raw === "dev" || raw === "beta" || raw === "prod") return raw

  if (raw === "latest") return "prod"

  return "dev"
}

// Capri: its own app ids (keep in sync with src/main/constants.ts), so it installs beside OpenCode Desktop.
const APP_IDS = {
  dev: "io.github.seanyih.capri.dev",
  beta: "io.github.seanyih.capri.beta",
  prod: "io.github.seanyih.capri",
} as const

// libappimage (used by AppImageLauncher) resolves the .desktop entry inside an
// AppImage by globbing `*.desktop` at the squashfs root. If the main
// executable itself ends in `.desktop` (prod appId `ai.opencode.desktop`), the
// ELF binary matches the glob and is parsed as a desktop entry, so
// integration fails with `Malformed desktop entry: Unexpected char '\x7f' at 0`
// (0x7F is the first byte of the ELF magic).
// https://github.com/anomalyco/opencode/issues/51867
// Strip a trailing `.desktop` so the executable can never collide with the
// desktop-entry glob. Beta/dev appIds end in `.beta`/`.dev` and are unaffected.
function linuxExecutableName(appId: string): string {
  return appId.replace(/\.desktop$/, "")
}

const getBase = (appId: string): Configuration => {
  const target = getCurrentCli()

  return {
    artifactName: "capri-desktop-${os}-${arch}.${ext}",
    directories: {
      output: "dist",
      buildResources: "resources",
    },
    // Linux launchers are .desktop files, so this is the desktop file name,
    // not just the app id. For prod, app id "ai.opencode.desktop" becomes
    // "ai.opencode.desktop.desktop".
    // https://developer.gnome.org/documentation/guidelines/maintainer/integrating.html
    // https://www.electron.build/docs/linux/
    extraMetadata: {
      desktopName: `${appId}.desktop`,
    },
    files: [
      "out/**/*",
      "resources/**/*",
      "!resources/opencode-cli*",
      // Keep only the target platform's node-pty prebuild when cross-packaging with --cpu=*.
      ...CLI_BINARIES.filter((item) => item.os !== target.os || item.cpu !== target.cpu).map(
        (item) => `!**/node_modules/@lydell/node-pty-${item.os}-${item.cpu}{,/**/*}`,
      ),
      // Log export imports Zip.js as ESM. Keep index.js and lib, including its inline worker.
      "!**/node_modules/@zip.js/zip.js/dist{,/**/*}",
      "!**/node_modules/@zip.js/zip.js/{index.cjs,index.min.js,index-fflate.js,deno.json,eslint.config.mjs}",
      // Nothing executes type declarations or source maps, and every entry costs startup time: the
      // main process parses the whole asar header before it runs any JavaScript.
      "!**/node_modules/**/*.d.{ts,cts,mts}",
      "!**/node_modules/**/*.d.{ts,cts,mts}.map",
      "!**/node_modules/**/*.{js,cjs,mjs}.map",
      // These packages execute compiled JavaScript, not their sources.
      "!**/node_modules/ajv/lib{,/**/*}",
      "!**/node_modules/ajv-formats/src{,/**/*}",
      // Keep js-yaml's CommonJS sources and dist/js-yaml.mjs ESM entry, not browser bundles or its CLI.
      "!**/node_modules/js-yaml/dist/{js-yaml.js,js-yaml.min.js,*.map}",
      "!**/node_modules/js-yaml/bin{,/**/*}",
    ],
    extraResources: [
      {
        from: "resources/",
        to: "",
        filter: ["opencode-cli", "opencode-cli.exe", "opencode-cli.version"],
      },
    ],
    afterPack: async (context) => {
      const arch = Arch[context.arch]

      // The --arm64 flag picks Electron while OPENCODE_CLI_TARGET picks the CLI and node-pty, so they can disagree.
      if (arch !== "x64" && arch !== "arm64") throw new Error(`Unsupported desktop architecture: ${arch}`)

      if (arch !== target.cpu) throw new Error(`Packaging ${arch} Electron with the ${target.target} CLI`)
      const resources = context.packager.getResourcesDir(context.appOutDir)
      const cli = path.join(resources, context.electronPlatformName === "win32" ? "opencode-cli.exe" : "opencode-cli")

      const file = await stat(cli)

      if (!file.isFile() || file.size === 0) throw new Error(`Bundled CLI must be a non-empty file: ${cli}`)
      await NativeArch.verify(cli, arch)
      const version = path.join(path.dirname(cli), "opencode-cli.version")

      if ((await stat(version)).size === 0) throw new Error(`Bundled CLI version must be a non-empty file: ${version}`)

      if (context.electronPlatformName !== "win32") return

      const prebuilds = path.join(
        resources,
        "app.asar.unpacked/node_modules",
        nodePtyPackage(target.target),
        "prebuilds",
        `${target.os}-${target.cpu}`,
      )

      const addon = path.join(prebuilds, "conpty.node")

      if ((await stat(addon)).size === 0) throw new Error(`Bundled node-pty must be a non-empty file: ${addon}`)
      const entries = await readdir(prebuilds, { recursive: true, withFileTypes: true })

      await Promise.all(
        entries
          .filter((entry) => entry.isFile())
          .map(async (entry) => {
            const file = path.join(entry.parentPath, entry.name)

            if (await NativeArch.isNative(file)) await NativeArch.verify(file, arch)
          }),
      )
    },
    mac: {
      category: "public.app-category.developer-tools",
      icon: `resources/icons/icon.icns`,
      extendInfo: {
        NSAutoFillRequiresTextContentTypeForOneTimeCodeOnMac: true,
      },
      identity: macIdentity ? undefined : "-",
      hardenedRuntime: macIdentity,
      gatekeeperAssess: false,
      entitlements: "resources/entitlements.plist",
      entitlementsInherit: "resources/entitlements.plist",
      sign: async (options) => {
        const { sign } = await import("app-builder-lib/out/codeSign/macCodeSign")
        await sign(macSignOptions(options))
      },
      notarize: macNotarize,
      target: ["dmg", "zip"],
    },
    protocols: {
      name: "Capri",
      schemes: ["opencode"],
    },
    win: {
      icon: `resources/icons/icon.ico`,
      signtoolOptions: {
        sign: signWindows,
      },
      target: ["nsis"],
      verifyUpdateCodeSignature: false,
    },
    nsis: {
      include: path.join(packageDir, "resources", "windows", "installer.nsh"),
      oneClick: true,
      perMachine: false,
      installerIcon: `resources/icons/icon.ico`,
      installerHeaderIcon: `resources/icons/icon.ico`,
    },
    linux: {
      icon: `resources/icons`,
      category: "Development",
      executableName: linuxExecutableName(appId),
      // Derive the installed `.desktop` filename from `desktopName`
      // (`ai.opencode.desktop.desktop` for prod) instead of `executableName`,
      // so window association is unaffected by the executable rename above.
      syncDesktopName: true,
      desktop: {
        entry: {
          // Match the installed .desktop file and hicolor icon basename so
          // Linux shells can associate the running Electron window with its launcher.
          StartupWMClass: appId,
        },
      },
      target: ["AppImage", "deb", "rpm"],
    },
  }
}

export function getConfig() {
  const channel = resolveChannel()
  const appId = APP_IDS[channel]
  const base = getBase(appId)

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId,
        productName: "Capri Dev",
        deb: { fpm: [metainfoFpm(appId)] },
        rpm: { packageName: "capri-dev", fpm: [rpmNoBuildIdLinksFpm, metainfoFpm(appId)] },
      }
    }

    case "beta": {
      return {
        ...base,
        appId,
        productName: "Capri Beta",
        protocols: { name: "Capri Beta", schemes: ["opencode"] },
        // Capri: no update feed (the updater is off; see gui-extensions/src/updater/main.ts).
        publish: null,
        deb: { fpm: [metainfoFpm(appId)] },
        rpm: { packageName: "capri-beta", fpm: [rpmNoBuildIdLinksFpm, metainfoFpm(appId)] },
      }
    }

    case "prod": {
      return {
        ...base,
        appId,
        productName: "Capri",
        protocols: { name: "Capri", schemes: ["opencode"] },
        // Capri: no update feed (the updater is off; see gui-extensions/src/updater/main.ts).
        publish: null,
        deb: { fpm: [metainfoFpm(appId)] },
        rpm: { packageName: "capri", fpm: [rpmNoBuildIdLinksFpm, metainfoFpm(appId)] },
      }
    }
  }
}

export default getConfig()
