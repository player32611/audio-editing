import {
  AUDIO_FILE_EXTENSION,
  IMAGE_FILE_EXTENSION,
  LANGUAGE,
  VIDEO_FILE_EXTENSION,
  WHISPER_MODEL_TYPE,
  WHISPER_MODEL_OUTPUT_EXTENSION
} from './constants'

export type Theme = 'dark' | 'light' | 'system'

export type Path = 'output' | 'input' | 'cover'

export type AudioFileExtension = (typeof AUDIO_FILE_EXTENSION)[keyof typeof AUDIO_FILE_EXTENSION]

export type VideoFileExtension = (typeof VIDEO_FILE_EXTENSION)[keyof typeof VIDEO_FILE_EXTENSION]

export type ImageFileExtension = (typeof IMAGE_FILE_EXTENSION)[keyof typeof IMAGE_FILE_EXTENSION]

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE]

export type WhisperModel = (typeof WHISPER_MODEL_TYPE)[keyof typeof WHISPER_MODEL_TYPE]

export type WhisperModelOutputExtension =
  (typeof WHISPER_MODEL_OUTPUT_EXTENSION)[keyof typeof WHISPER_MODEL_OUTPUT_EXTENSION]

export type Database = 'status' | 'type' | 'work_history'

export type WorkStatus = '待处理' | '处理中' | '已完成' | '已中断'

export type WorkType = '音频编辑' | '音频提取' | '音频裁剪' | '汉英转译' | '语音识别'

export interface FileInfo {
  name: string
  ext: string
  fullName: string
  dir: string
}

export interface AudioTag {
  title?: string
  artist?: string
  album_artist?: string
  album?: string
  composer?: string
  genre?: string
  date?: string
  track?: string
  disc?: string
}

export interface StatusTable {
  id: number
  name: string
}

export interface TypeTable {
  id: number
  name: string
}

export interface WorkHistoryTable {
  id: number
  typeId: number
  name: string
  time: string
  statusId: number
  path: string
}

export interface WorkHistoryUnion extends WorkHistoryTable {
  typeName: WorkType
  statusName: WorkStatus
}

export interface WorkHistoryInsert extends WorkHistoryTable {
  id?: number
  time?: string
}

export interface GetVoiceOptions {
  inputVideo: string
  outputAudio: string
  audioExtension: AudioFileExtension
  audioBitrate: string
  audioQuality: number
  startTime: number
  duration: number
}

export interface CutAudioOptions {
  inputAudio: string
  outputAudio: string
  audioExtension: AudioFileExtension
  audioBitrate: string
  audioQuality: number
  startTime: number
  duration: number
}

export interface SetAduioTagOptions extends AudioTag {
  inputAudio: string
  outputAudio: string
  coverPath?: string
}

export interface WhisperOptions {
  inputAudio: string
  outputFileWithoutExt: string
  outputExtension: WhisperModelOutputExtension
  language: Language
  model: WhisperModel
  translate?: boolean
}
