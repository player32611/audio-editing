import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Path, Theme } from '../shared/type'

// Custom APIs for renderer
const api = {
  selectFolder: (defaultPath: string) => ipcRenderer.invoke('api:selectFolder', defaultPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('theme', {
      set: (theme: Theme) => ipcRenderer.invoke('theme:set', theme),
      get: () => ipcRenderer.invoke('theme:get'),
      isDark: () => ipcRenderer.invoke('theme:isDark'),
      onChanged: (callback: (isDark: boolean) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, isDark: boolean): void => {
          callback(isDark)
        }

        ipcRenderer.on('theme:changed', listener)

        return () => ipcRenderer.removeListener('theme:changed', listener)
      }
    })
    contextBridge.exposeInMainWorld('path', {
      set: (type: Path, path: string) => ipcRenderer.invoke('path:set', type, path),
      get: (type: Path) => ipcRenderer.invoke('path:get', type)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
