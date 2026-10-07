export type Theme = 'dark' | 'light' | 'system'

export type Path = 'output' | 'input'

export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'flac' | 'ogg'

export type Database = 'status' | 'type' | 'work_history'

export type WorkStatus = '待处理' | '处理中' | '已完成' | '已中断'

export type WorkType = '音频提取' | '音频裁剪' | '汉英转译'

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

export interface FfmpegCutVideo {
  // inputAudio: string
  // outputAudio: string
  // audioFormat?: 'mp3' | 'wav' | 'aac' | 'flac' | 'ogg'
  // audioBitrate?: string
  // audioQuality?: number
  // startTime?: number
  // duration?: number
}
