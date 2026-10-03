import { ElectronAPI } from '@electron-toolkit/preload'
import {
  Theme,
  Path,
  Database,
  StatusTable,
  WorkHistoryUnion,
  WorkHistoryInput,
  WorkType,
  WorkStatus
} from '../shared/type'
import type { OpenDialogOptions } from 'electron'
import { GetVoiceOptions } from '@sellmind/video-editor-core'

export {}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFolder: (options: OpenDialogOptions) => Promise<string>
      selectFile: (options: OpenDialogOptions) => Promise<string>
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
      insertWorkHistory: (data: WorkHistoryInput) => Promise<void>
    }
  }
}
