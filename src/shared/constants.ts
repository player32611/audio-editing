export const STORE_KEY = {
  THEME: 'theme',
  PATH: 'path'
}

export const AUDIO_FILE_EXTENSION = {
  MP3: 'mp3',
  M4A: 'm4a',
  AAC: 'aac',
  OGG: 'ogg',
  WAV: 'wav',
  FLAC: 'flac'
} as const

export const VIDEO_FILE_EXTENSION = {
  MP4: 'mp4',
  AVI: 'avi',
  MOV: 'mov',
  MKV: 'mkv',
  WEBM: 'webm',
  FLV: 'flv'
} as const

export const IMAGE_FILE_EXTENSION = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp'
} as const

export const LANGUAGE = {
  ZH: 'zh',
  YUE: 'yue',
  EN: 'en',
  JA: 'ja',
  FR: 'fr',
  AUTO: 'auto'
} as const

export const WHISPER_MODEL_TYPE = {
  TINY: 'tiny',
  BASE: 'base',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  TURBO: 'turbo'
} as const

/**
 * UI 模型名 -> whisper.cpp GGML 模型文件名。
 * 官方模型托管于 Hugging Face（见 models/download-ggml-model.cmd）：
 * https://huggingface.co/ggerganov/whisper.cpp/resolve/main/<文件名>
 */
export const WHISPER_MODEL_NAME = {
  tiny: 'ggml-tiny.bin',
  base: 'ggml-base.bin',
  small: 'ggml-small.bin',
  medium: 'ggml-medium.bin',
  large: 'ggml-large-v3.bin',
  turbo: 'ggml-large-v3-turbo.bin'
} as const

export const WHISPER_MODEL_EXTENSION = {
  BIN: 'bin'
} as const

export const WHISPER_MODEL_OUTPUT_EXTENSION = {
  TXT: 'txt',
  SRT: 'srt',
  VTT: 'vtt',
  LRC: 'lrc',
  CSV: 'csv',
  JSON: 'json'
} as const

export const SINGAL = {
  SIGKILL: 'SIGKILL'
} as const
