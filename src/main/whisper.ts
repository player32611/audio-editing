import { app, ipcMain } from 'electron'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Ffmpeg from 'fluent-ffmpeg'
import type {
  WhisperDownloadProgress,
  WhisperModel,
  WhisperModelOutputExtension,
  WhisperOptions
} from '../shared/type'
import { setWorkList } from './work'

/**
 * 模型下载源（按顺序逐个尝试）。
 * 1. hf-mirror：国内社区镜像，直连快（解决无法访问 huggingface.co 的问题）；
 * 2. 官方源：能访问 huggingface.co 时使用（有代理 / 可直连）。
 * 可继续追加 ModelScope 镜像或用户自定义源。
 */
const MODEL_SOURCES = [
  'https://hf-mirror.com/ggerganov/whisper.cpp/resolve/main',
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main'
]

/**
 * 集成 whisper.cpp（与内置 FFmpeg 同一模式）：
 * - 二进制：生产环境随应用分发（electron-builder extraResources 复制到
 *   process.resourcesPath/whisper/），开发环境用 WHISPER_PATH 环境变量指定。
 * - 模型（GGML）：运行时按需下载，缓存到 userData/models/whisper/，此处不负责下载。
 */

const WHISPER_BINARY_NAME = process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli'

/**
 * UI 模型名 -> whisper.cpp GGML 模型文件名。
 * 官方模型托管于 Hugging Face（见 models/download-ggml-model.cmd）：
 * https://huggingface.co/ggerganov/whisper.cpp/resolve/main/<文件名>
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

/**
 * 解析 whisper-cli 二进制路径：
 * - 环境变量 WHISPER_PATH 优先（开发 / 调试）
 * - 开发环境：项目 resources/whisper/
 * - 打包后：二进制位于 app.asar 内，由 asarUnpack 解包到 app.asar.unpacked，
 *   需从解包副本启动（与内置 FFmpeg 同一模式）
 */
export function getWhisperBinaryPath(): string {
  if (process.env.WHISPER_PATH) return process.env.WHISPER_PATH
  const binaryPath = join(app.getAppPath(), 'resources', 'whisper', WHISPER_BINARY_NAME)
  return app.isPackaged ? binaryPath.replace('app.asar', 'app.asar.unpacked') : binaryPath
}

/** 模型存放目录（环境变量优先；默认缓存于用户数据目录，运行时按需下载） */
export function getWhisperModelDir(): string {
  return process.env.WHISPER_MODEL_DIR || join(app.getPath('userData'), 'models', 'whisper')
}

/** 指定模型的 GGML 文件绝对路径 */
export function getWhisperModelPath(model: WhisperModel): string {
  return join(getWhisperModelDir(), MODEL_FILE[model])
}

/** 指定模型在某个源下的完整下载地址 */
function getSourceUrl(baseUrl: string, model: WhisperModel): string {
  return `${baseUrl}/${MODEL_FILE[model]}`
}

/**
 * 从单个源下载模型到临时文件（调用方负责重命名与清理）。
 * 失败（网络错误 / 非 2xx / HTML 错误页 / 下载不完整）时抛错，供上层切换下一个源。
 */
async function downloadFrom(
  model: WhisperModel,
  baseUrl: string,
  tmpPath: string,
  onProgress?: (progress: WhisperDownloadProgress) => void
): Promise<void> {
  const res = await fetch(getSourceUrl(baseUrl, model), { redirect: 'follow' })

  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}`)
  }

  // 镜像/网关可能对 404 返回 HTML 页面且 status 200，按 content-type 拦截
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    throw new Error('返回 HTML 页面，疑似未命中模型')
  }

  const total = Number(res.headers.get('content-length') || 0)
  let loaded = 0
  const writer = createWriteStream(tmpPath)

  try {
    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = value as Uint8Array
      loaded += chunk.byteLength
      onProgress?.({ model, loaded, total, percent: total > 0 ? loaded / total : 0 })

      // 背压：写缓冲满时等待排空，避免大文件撑爆内存
      if (!writer.write(chunk)) {
        await new Promise<void>((resolve, reject) => {
          writer.once('drain', resolve)
          writer.once('error', reject)
        })
      }
    }

    await new Promise<void>((resolve, reject) => {
      writer.once('finish', resolve)
      writer.once('error', reject)
      writer.end()
    })
  } catch (err) {
    writer.destroy()
    throw err
  }

  // content-length 已知时校验完整性，防止把中断的半成品当成品
  if (total > 0 && loaded < total) {
    throw new Error(`下载不完整：${loaded}/${total} 字节`)
  }
}

/**
 * 下载模型到本地缓存目录（已存在则直接返回路径）。
 * 依次尝试各个源，全部失败才抛错；先写临时文件再原子重命名，避免中断留下半成品。
 */
export async function downloadModel(
  model: WhisperModel,
  onProgress?: (progress: WhisperDownloadProgress) => void
): Promise<string> {
  const modelPath = getWhisperModelPath(model)
  if (existsSync(modelPath)) return modelPath

  const dir = getWhisperModelDir()
  await mkdir(dir, { recursive: true })

  const tmpPath = join(dir, `${MODEL_FILE[model]}.part`)
  const errors: string[] = []

  for (const baseUrl of MODEL_SOURCES) {
    try {
      await downloadFrom(model, baseUrl, tmpPath, onProgress)
      await rename(tmpPath, modelPath)
      return modelPath
    } catch (err) {
      errors.push(`${baseUrl} -> ${err instanceof Error ? err.message : String(err)}`)
      await rm(tmpPath, { force: true })
    }
  }

  throw new Error(`模型下载失败，已尝试全部源：\n${errors.join('\n')}`)
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
  if (options.prompt) args.push('--prompt', options.prompt)
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

/** 提取 whisper 进度行 `whisper_print_progress_callback: progress = NN%` 中的百分比 */
const PROGRESS_RE = /progress\s*=\s*(\d+)%/

/**
 * 启动 whisper-cli 并等待结束；whisper 的进度与错误都输出在 stderr。
 * 对 stderr 做增量解析：按 \r / \n 切分，实时提取进度回调；
 * 同时仅保留末尾若干行用于失败时报错，不累积整个 stderr。
 */
function runWhisperCli(
  binary: string,
  args: string[],
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true })

    // 尚未以 \r / \n 结束的残段，留待下一个 chunk 补齐
    let pending = ''
    // 只留末尾几行，避免长音频时 stderr 无限增长
    const errorTail: string[] = []

    child.stderr.on('data', (chunk: Buffer) => {
      pending += chunk.toString()

      // 进度与日志可能用 \r 原地刷新，须同时按 \r 和 \n 切分
      const segments = pending.split(/[\r\n]+/)
      pending = segments.pop() ?? ''

      for (const segment of segments) {
        if (!segment) continue
        const match = PROGRESS_RE.exec(segment)
        if (match) onProgress?.(Number(match[1]))
        errorTail.push(segment)
      }
      if (errorTail.length > 10) errorTail.splice(0, errorTail.length - 10)
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else {
        reject(new Error(errorTail.join('\n').trim() || `whisper.cpp 进程退出，退出码 ${code}`))
      }
    })
  })
}

/** 完整识别流程：校验 -> FFmpeg 转码 -> whisper-cli 推理 -> 清理临时文件 */
async function runWhisper(
  options: WhisperOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
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
    await runWhisperCli(binary, buildArgs(options, wavPath), onProgress)
  } finally {
    await rm(wavPath, { force: true })
  }
}

ipcMain.handle('whisper:checkModel', (_, model: WhisperModel): boolean => {
  if (existsSync(getWhisperModelPath(model))) return true
  return false
})

ipcMain.handle('whisper:downloadModel', (event, model: WhisperModel): Promise<string> => {
  return downloadModel(model, (progress) => {
    event.sender.send('whisper:downloadProgress', progress)
  })
})

ipcMain.handle('whisper:transcribe', (_, options: WhisperOptions, id?: number): Promise<void> => {
  return runWhisper(options, (progress) => {
    if (id) {
      setWorkList(id, { progress })
    }
  })
})
