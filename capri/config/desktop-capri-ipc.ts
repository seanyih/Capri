import { ipcMain } from "electron"
import { isLevel, read, setCyberpsycosis } from "./capri-file"
import { isRendererUrl } from "./windows/scheme"

// Capri: IPC for capri.json (see capri-file.ts). The preload exposes these as window.electron.capri.
export const ReadChannel = "capri:read"
export const SetCyberpsycosisChannel = "capri:set-cyberpsycosis"

export function registerCapriHandlers() {
  ipcMain.handle(ReadChannel, (event) => (isRendererUrl(event.senderFrame?.url) ? read() : {}))
  // SAFETY: Electron delivers untrusted IPC arguments; only the four level names are accepted.
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- see SAFETY above
  ipcMain.handle(SetCyberpsycosisChannel, (event, level: unknown) => {
    if (!isRendererUrl(event.senderFrame?.url) || !isLevel(level)) return read()
    setCyberpsycosis(level)
    return read()
  })
}
