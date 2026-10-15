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
  SetAduioTagOptions,
  WhisperDownloadProgress,
  WhisperOptions,
  WhisperModel,
  WorkListItem
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
      getAppData: () => Promise<string>
      getUserData: () => Promise<string>
    }
    ffmpeg: {
      getVoice: (options: GetVoiceOptions, id?: number) => Promise<void>
      cutAudio: (options: CutAudioOptions, id?: number) => Promise<void>
      getMediaData: (path: string) => Promise<FfprobeData>
      getAudioStream: (path: string) => Promise<FfprobeStream>
      getAudioCover: (path: string) => Promise<Uint8Array<ArrayBuffer>>
      setAudioTags: (options: SetAduioTagOptions, id?: number) => Promise<void>
    }
    whisper: {
      transcribe: (options: WhisperOptions, id?: number) => Promise<void>
      checkModel: (model: WhisperModel) => Promise<boolean>
      downloadModel: (model: WhisperModel) => Promise<string>
      onDownloadProgress: (callback: (progress: WhisperDownloadProgress) => void) => () => void
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
      set: (id: number, data: WorkListItem) => Promise<void>
      get: (id: number) => Promise<WorkStatus>
      getAll: () => Promise<Map<number, WorkListItem>>
      delete: (id: number) => Promise<void>
      deleteBatch: (ids: number[]) => Promise<void>
      onChanged: (callback: (worklist: Map<number, WorkListItem>) => void) => () => void
    }
  }
}
