import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('darkMode', {
      toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
      system: () => ipcRenderer.invoke('dark-mode:system'),
      get: () => ipcRenderer.invoke('dark-mode:get'),
      onChanged: (callback: (isDark: boolean) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, isDark: boolean): void => {
          callback(isDark)
        }

        ipcRenderer.on('dark-mode:changed', listener)

        return () => {
          ipcRenderer.removeListener('dark-mode:changed', listener)
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
