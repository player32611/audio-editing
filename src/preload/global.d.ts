import type { ElectronAPI } from '@electron-toolkit/preload'
import type {
  Theme,
  Path,
  Database,
  StatusTable,
  WorkHistoryUnion,
  WorkHistoryInsert,
  WorkType,
  WorkStatus,
  WorkHistoryTable,
  CutAudioOptions,
  FileInfo,
  SetAduioTagOptions
} from '../shared/type'
import type { GetVoiceOptions } from '@sellmind/video-editor-core'
import type { OpenDialogOptions } from 'electron'
import type { FfprobeData, FfprobeStream } from 'fluent-ffmpeg'

export {}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFile: (options: OpenDialogOptions) => Promise<string>
      selectFolder: (options: OpenDialogOptions) => Promise<string>
      openFolder: (path: string) => Promise<string>
      showItemInFolder: (path: string) => Promise<boolean>
      existsSync: (path: string) => Promise<boolean>
      parseFilePath: (filePath: string) => Promise<FileInfo>
      loadImage: (filePath: string) => Promise<{ dataUrl: string }>
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
    ffmpeg: {
      getVoice: (options: GetVoiceOptions) => Promise<void>
      cutAudio: (options: CutAudioOptions) => Promise<void>
      getMediaData: (path: string) => Promise<FfprobeData>
      getAudioStream: (path: string) => Promise<FfprobeStream>
      getAudioCover: (path: string) => Promise<Uint8Array<ArrayBuffer>>
      setAudioTags: (options: SetAduioTagOptions) => Promise<void>
    }
    database: {
      selectAll: (database: Database) => Promise<StatusTable[]>
      selectStatus: (name: WorkStatus) => Promise<number>
      selectType: (name: WorkType) => Promise<number>
      selectWorkHistoryUnion: () => Promise<WorkHistoryUnion[]>
      insertWorkHistory: (data: WorkHistoryInsert) => Promise<number>
      updateWorkHistory: (id: number, data: Partial<Omit<WorkHistoryTable, 'id'>>) => Promise<void>
      deleteAll: (database: Database) => Promise<void>
      deleteById: (database: Database, id: number) => Promise<void>
      deleteBatchByIds: (database: Database, ids: number[]) => Promise<void>
    }
    work: {
      set: (id: number, work: WorkStatus) => Promise<void>
      get: (id: number) => Promise<WorkStatus>
      getAll: () => Promise<{ id: number; status: WorkStatus }>
      delete: (id: number) => Promise<void>
      onChanged: (callback: (worklist: Promise<void>[]) => void) => () => void
    }
  }
}
