import { ElectronAPI } from '@electron-toolkit/preload'
import {
  Theme,
  Path,
  Database,
  StatusTable,
  WorkHistoryUnion,
  WorkHistoryInput,
  WorkType,
  WorkStatus,
  WorkHistoryTable
} from '../shared/type'
import { GetVoiceOptions } from '@sellmind/video-editor-core'
import type { OpenDialogOptions } from 'electron'

export {}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFile: (options: OpenDialogOptions) => Promise<string>
      selectFolder: (options: OpenDialogOptions) => Promise<string>
      openFolder: (path: string) => Promise<string>
    }
    theme: {
      set: (theme: Theme) => Promise<Theme>
      get: () => Promise<Theme>
      isDark: () => Promise<boolean>
      onChanged: (callback: (isDark: boolean) => void) => () => void
    }
    path: {
      set: (type: Path, path: string) => Promise<string>
      get: (type: Path) => Promise<string>
    }
    sellmind: {
      getVoice: (options: GetVoiceOptions) => Promise<void>
    }
    database: {
      selectAll: (database: Database) => Promise<StatusTable[]>
      selectStatus: (name: WorkStatus) => Promise<number>
      selectType: (name: WorkType) => Promise<number>
      selectWorkHistory: () => Promise<WorkHistoryUnion[]>
      insertWorkHistory: (data: WorkHistoryInput) => Promise<number>
      updateWorkHistory: (data: WorkHistoryTable) => Promise<void>
      deleteAll: (database: Database) => Promise<void>
      deleteById: (database: Database, id: number) => Promise<void>
      deleteBatchByIds: (database: Database, ids: number[]) => Promise<void>
    }
    work: {
      set: (id: number, work: WorkStatus) => Promise<void>
      get: (id: number) => Promise<WorkStatus>
      onChanged: (callback: (worklist: Promise<void>[]) => void) => () => void
    }
  }
}
