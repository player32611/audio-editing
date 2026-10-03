import { contextBridge, ipcRenderer, OpenDialogOptions } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Database, Path, Theme, WorkHistoryInput, WorkStatus, WorkType } from '../shared/type'
import { GetVoiceOptions } from '@sellmind/video-editor-core'

// Custom APIs for renderer
const api = {
  selectFolder: (options: OpenDialogOptions) => ipcRenderer.invoke('api:selectFolder', options),
  selectFile: (options: OpenDialogOptions) => ipcRenderer.invoke('api:selectFile', options)
}

const theme = {
  set: (theme: Theme) => ipcRenderer.invoke('theme:set', theme),
  get: () => ipcRenderer.invoke('theme:get'),
  isDark: () => ipcRenderer.invoke('theme:isDark'),
  onChanged: (callback: (isDark: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, isDark: boolean): void => callback(isDark)

    ipcRenderer.on('theme:changed', listener)

    return () => ipcRenderer.removeListener('theme:changed', listener)
  }
}

const path = {
  set: (type: Path, path: string) => ipcRenderer.invoke('path:set', type, path),
  get: (type: Path) => ipcRenderer.invoke('path:get', type)
}

const sellmind = {
  getVoice: (options: GetVoiceOptions) => ipcRenderer.invoke('sellmind:getVoice', options)
}

const database = {
  selectAll: (database: Database) => ipcRenderer.invoke('database:selectAll', database),
  selectStatus: (name: WorkStatus) => ipcRenderer.invoke('database:selectStatus', name),
  selectType: (name: WorkType) => ipcRenderer.invoke('database:selectType', name),
  selectWorkHistory: () => ipcRenderer.invoke('database:selectWorkHistory'),
  insertWorkHistory: (data: WorkHistoryInput) =>
    ipcRenderer.invoke('database:insertWorkHistory', data)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('theme', theme)
    contextBridge.exposeInMainWorld('path', path)
    contextBridge.exposeInMainWorld('sellmind', sellmind)
    contextBridge.exposeInMainWorld('database', database)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.theme = theme
  window.path = path
  window.sellmind = sellmind
  window.database = database
}
