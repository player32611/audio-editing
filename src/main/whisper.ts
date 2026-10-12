import { app, ipcMain } from 'electron'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Ffmpeg from 'fluent-ffmpeg'
import type { WhisperModel, WhisperModelOutputExtension, WhisperOptions } from '../shared/type'

/**
 * 集成 whisper.cpp（与内置 FFmpeg 同一模式）：
 * - 二进制：生产环境随应用分发（electron-builder extraResources 复制到
 *   process.resourcesPath/whisper/），开发环境用 WHISPER_PATH 环境变量指定。
 * - 模型（GGML）：运行时按需下载，缓存到 userData/models/whisper/，此处不负责下载。
 */

const WHISPER_BINARY_NAME = process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli'

/**
 * UI 模型名 -> whisper.cpp GGML 模型文件名。
 * 官方模型托管于 Hugging Face：
 * https://huggingface.co/ggml-org/whisper.cpp/resolve/main/<文件名>
 */
const MODEL_FILE: Record<WhisperModel, string> = {
  tiny: 'ggml-tiny.bin',
  base: 'ggml-base.bin',
  small: 'ggml-small.bin',
  medium: 'ggml-medium.bin',
  large: 'ggml-large-v3.bin',
  turbo: 'ggml-large-v3-turbo.bin'
}

/**
 * UI 输出格式 -> whisper-cli 输出参数。
 * 注意：JSON 是 -oj（--output-json），不存在 -ojson 参数。
 */
const OUTPUT_FLAG: Record<WhisperModelOutputExtension, string> = {
  txt: '-otxt',
  srt: '-osrt',
  vtt: '-ovtt',
  lrc: '-olrc',
  csv: '-ocsv',
  json: '-oj'
}

/** 解析 whisper-cli 二进制路径（环境变量优先；开发取项目 resources/，生产取随应用分发的 resources） */
export function getWhisperBinaryPath(): string {
  if (process.env.WHISPER_PATH) return process.env.WHISPER_PATH
  const base = app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'resources')
  return join(base, 'whisper', WHISPER_BINARY_NAME)
}

/** 模型存放目录（环境变量优先；默认缓存于用户数据目录，运行时按需下载） */
export function getWhisperModelDir(): string {
  return process.env.WHISPER_MODEL_DIR || join(app.getPath('userData'), 'models', 'whisper')
}

/** 指定模型的 GGML 文件绝对路径 */
export function getWhisperModelPath(model: WhisperModel): string {
  return join(getWhisperModelDir(), MODEL_FILE[model])
}

/** 构建 whisper-cli 参数 */
function buildArgs(options: WhisperOptions, wavPath: string): string[] {
  const args = [
    '-f',
    wavPath,
    '-m',
    getWhisperModelPath(options.model),
    '-l',
    options.language,
    '-of',
    options.outputFileWithoutExt,
    OUTPUT_FLAG[options.outputExtension],
    '-pp'
  ]
  if (options.translate) args.push('-tr')
  return args
}

/**
 * 用内置 FFmpeg 将任意音频转为 whisper-cli 要求的 16k 单声道 WAV，
 * 返回临时文件路径（调用方负责清理）。
 */
function convertToWav(inputAudio: string): Promise<string> {
  const wavPath = join(tmpdir(), `whisper-${randomUUID()}.wav`)

  return new Promise<string>((resolve, reject) => {
    Ffmpeg(inputAudio)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', reject)
      .on('end', () => resolve(wavPath))
      .save(wavPath)
  })
}

/** 启动 whisper-cli 并等待结束；whisper 的进度与错误都输出在 stderr */
function runWhisperCli(binary: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true })

    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `whisper.cpp 进程退出，退出码 ${code}`))
    })
  })
}

/** 完整识别流程：校验 -> FFmpeg 转码 -> whisper-cli 推理 -> 清理临时文件 */
async function runWhisper(options: WhisperOptions): Promise<void> {
  const binary = getWhisperBinaryPath()
  const model = getWhisperModelPath(options.model)

  if (!existsSync(binary)) {
    throw new Error(`whisper.cpp 二进制未找到：${binary}`)
  }
  if (!existsSync(model)) {
    throw new Error(`识别模型尚未下载：${model}`)
  }

  const wavPath = await convertToWav(options.inputAudio)
  try {
    await runWhisperCli(binary, buildArgs(options, wavPath))
  } finally {
    await rm(wavPath, { force: true })
  }
}

ipcMain.handle('whisper:transcribe', (_event, options: WhisperOptions): Promise<void> => {
  return runWhisper(options)
})
