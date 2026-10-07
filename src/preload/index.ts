import { contextBridge, ipcRenderer, OpenDialogOptions } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  Database,
  Path,
  Theme,
  WorkHistoryInsert,
  WorkHistoryTable,
  WorkStatus,
  WorkType
} from '../shared/type'
import { GetVoiceOptions } from '@sellmind/video-editor-core'

// Custom APIs for renderer
const api = {
  selectFile: (options: OpenDialogOptions) => ipcRenderer.invoke('api:selectFile', options),
  selectFolder: (options: OpenDialogOptions) => ipcRenderer.invoke('api:selectFolder', options),
  openFolder: (path: string) => ipcRenderer.invoke('api:openFolder', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('api:showItemInFolder', path)
}

const fs = {
  existsSync: (path: string) => ipcRenderer.invoke('fs:existsSync', path)
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
  selectWorkHistoryUnion: () => ipcRenderer.invoke('database:selectWorkHistoryUnion'),
  insertWorkHistory: (data: WorkHistoryInsert) =>
    ipcRenderer.invoke('database:insertWorkHistory', data),
  updateWorkHistory: (id: number, data: Partial<Omit<WorkHistoryTable, 'id'>>) =>
    ipcRenderer.invoke('database:updateWorkHistory', id, data),
  deleteAll: (database: Database) => ipcRenderer.invoke('database:deleteAll', database),
  deleteById: (database: Database, id: number) =>
    ipcRenderer.invoke('database:deleteById', database, id),
  deleteBatchByIds: (database: Database, ids: number[]) =>
    ipcRenderer.invoke('database:deleteBatchByIds', database, ids)
}

const work = {
  set: (id: number, work: WorkStatus) => ipcRenderer.invoke('work:set', id, work),
  get: (id: number) => ipcRenderer.invoke('work:get', id),
  getAll: () => ipcRenderer.invoke('work:getAll'),
  delete: (id: number) => ipcRenderer.invoke('work:delete', id),
  onChanged: (callback: (worklist: Promise<void>[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, worklist: Promise<void>[]): void => {
      callback(worklist)
    }

    ipcRenderer.on('work:changed', listener)

    return () => ipcRenderer.removeListener('work:changed', listener)
  }
}

// 使用 `contextBridge` API 将 Electron API 暴露
// 只有在启用上下文隔离时才渲染，否则
// 只添加到 DOM 全局
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('fs', fs)
    contextBridge.exposeInMainWorld('theme', theme)
    contextBridge.exposeInMainWorld('path', path)
    contextBridge.exposeInMainWorld('sellmind', sellmind)
    contextBridge.exposeInMainWorld('database', database)
    contextBridge.exposeInMainWorld('work', work)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.fs = fs
  window.theme = theme
  window.path = path
  window.sellmind = sellmind
  window.database = database
  window.work = work
}
