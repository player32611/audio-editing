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
 * 模型下载源（按顺序逐个尝试）。
 * 1. hf-mirror：国内社区镜像，直连快（解决无法访问 huggingface.co 的问题）；
 * 2. 官方源：能访问 huggingface.co 时使用（有代理 / 可直连）。
 * 可继续追加 ModelScope 镜像或用户自定义源。
 */
export const WHISPER_MODEL_SOURCES = [
  'https://hf-mirror.com/ggerganov/whisper.cpp/resolve/main',
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main'
] as const

/**
 * UI 模型名 -> whisper.cpp GGML 模型文件名。
 * 官方模型托管于 Hugging Face（见 models/download-ggml-model.cmd）：
 * https://huggingface.co/ggerganov/whisper.cpp/resolve/main/<文件名>
 */
export const WHISPER_MODEL_NAME = {
  TINY: 'ggml-tiny.bin',
  BASE: 'ggml-base.bin',
  SMALL: 'ggml-small.bin',
  MEDIUM: 'ggml-medium.bin',
  LARGE: 'ggml-large-v3.bin',
  TURBO: 'ggml-large-v3-turbo.bin'
} as const

/**
 * UI 输出格式 -> whisper-cli 输出参数。
 * 注意：JSON 是 -oj（--output-json），不存在 -ojson 参数。
 */
export const WHISPER_CLI_OUTPUT_FLAG = {
  TXT: '-otxt',
  SRT: '-osrt',
  VTT: '-ovtt',
  LRC: '-olrc',
  CSV: '-ocsv',
  JSON: '-oj'
}

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
