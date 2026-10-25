import { app, ipcMain } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Ffmpeg from 'fluent-ffmpeg'
import type {
  WhisperDownloadProgress,
  WhisperModelType,
  AudioRecognizeOptions,
  StartRecognizeOptions
} from '../shared/type'
import { setInstanceList, setWorkList } from './work'
import {
  WHISPER_MODEL_SOURCES,
  SINGAL,
  WHISPER_MODEL_NAME,
  WHISPER_CLI_OUTPUT_FLAG
} from '../shared/constants'

/** 当前进行中的 whisper-stream 进程（同一时刻只允许一个） */
let streamProcess: ChildProcess | null = null

/**
 * 集成 whisper.cpp（与内置 FFmpeg 同一模式）：
 * - 二进制：生产环境随应用分发（electron-builder extraResources 复制到
 *   process.resourcesPath/whisper/），开发环境用 WHISPER_PATH 环境变量指定。
 * - 模型（GGML）：运行时按需下载，缓存到 userData/models/whisper/，此处不负责下载。
 */

const WHISPER_BINARY_NAME = process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli'
const WHISPER_STREAM_BINARY_NAME =
  process.platform === 'win32' ? 'whisper-stream.exe' : 'whisper-stream'

/** 提取 whisper 进度行 `whisper_print_progress_callback: progress = NN%` 中的百分比 */
const PROGRESS_RE = /progress\s*=\s*(\d+)%/
/** 剥离 whisper-stream 用于原地刷新的 ANSI 控制序列（\33[2K 等） */
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g
/** VAD 模式下每段转写形如 `[00:00:03.000 --> 00:00:05.000]  文本`，此正则剥离开头的时间戳 `[...]` */
const TIMESTAMP_RE = /^\[[^\]]*\]\s*/

/** 模型存放目录（默认缓存于用户数据目录，运行时按需下载） */
export function getWhisperModelDir(): string {
  return join(app.getPath('userData'), 'models', 'whisper')
}

/** 指定模型的 GGML 文件绝对路径 */
export function getWhisperModelPath(model: WhisperModelType): string {
  return join(getWhisperModelDir(), WHISPER_MODEL_NAME[model.toUpperCase()])
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

/** 解析 whisper-stream 二进制路径（与 whisper-cli 同一目录，WHISPER_STREAM_PATH 优先） */
function getWhisperStreamBinaryPath(): string {
  if (process.env.WHISPER_STREAM_PATH) return process.env.WHISPER_STREAM_PATH
  const binaryPath = join(app.getAppPath(), 'resources', 'whisper', WHISPER_STREAM_BINARY_NAME)
  return app.isPackaged ? binaryPath.replace('app.asar', 'app.asar.unpacked') : binaryPath
}

/**
 * 从单个源下载模型到临时文件（调用方负责重命名与清理）。
 * 失败（网络错误 / 非 2xx / HTML 错误页 / 下载不完整）时抛错，供上层切换下一个源。
 */
async function downloadFrom(
  model: WhisperModelType,
  baseUrl: string,
  tmpPath: string,
  onProgress?: (progress: WhisperDownloadProgress) => void
): Promise<void> {
  const res = await fetch(`${baseUrl}/${WHISPER_MODEL_NAME[model.toUpperCase()]}`, {
    redirect: 'follow'
  })

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
  model: WhisperModelType,
  onProgress?: (progress: WhisperDownloadProgress) => void
): Promise<string> {
  const modelPath = getWhisperModelPath(model)
  if (existsSync(modelPath)) return modelPath

  const dir = getWhisperModelDir()
  await mkdir(dir, { recursive: true })

  const tmpPath = join(dir, `${WHISPER_MODEL_NAME[model.toUpperCase()]}.part`)
  const errors: string[] = []

  for (const baseUrl of WHISPER_MODEL_SOURCES) {
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
function buildArgs(options: AudioRecognizeOptions, wavPath: string): string[] {
  const args = [
    '-f',
    wavPath,
    '-m',
    getWhisperModelPath(options.model),
    '-l',
    options.language,
    '-of',
    options.outputFileWithoutExt,
    WHISPER_CLI_OUTPUT_FLAG[options.outputExtension.toUpperCase()],
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
function convertToWav(inputAudio: string, id?: number): Promise<string> {
  const wavPath = join(tmpdir(), `whisper-${randomUUID()}.wav`)

  return new Promise<string>((resolve, reject) => {
    let cancelled = false
    const work = Ffmpeg(inputAudio)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', (err) => {
        // 停止时以 SIGKILL 标记，供渲染层静默处理（与 FFmpeg 取消链路一致）
        reject(cancelled ? new Error(SINGAL.SIGKILL) : err)
      })
      .on('end', () => resolve(wavPath))

    if (id) {
      work.on('start', () => {
        // 包装 kill：外部 deleteWorkList 触发时先置 cancelled，再杀底层 ffmpeg
        setInstanceList(id, {
          kill: (signal?: string | number) => {
            cancelled = true
            work.kill(signal ? String(signal) : SINGAL.SIGKILL)
          }
        })
      })
    }
    work.save(wavPath)
  })
}

/**
 * 启动 whisper-cli 并等待结束；whisper 的进度与错误都输出在 stderr。
 * 对 stderr 做增量解析：按 \r / \n 切分，实时提取进度回调；
 * 同时仅保留末尾若干行用于失败时报错，不累积整个 stderr。
 */
const runWhisperCli = (
  binary: string,
  args: string[],
  onProgress?: (progress: number) => void,
  id?: number
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true })
    if (id) setInstanceList(id, child)

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
    child.on('close', (code, signal) => {
      // Windows 上 kill 不产生 signal，用 child.killed 区分“用户停止”与“进程崩溃”
      if (child.killed) {
        reject(new Error(SINGAL.SIGKILL))
        return
      }
      if (code === 0) resolve()
      else {
        // 始终带上退出码/信号：进程崩溃（如访问违例 0xC0000005）时 stderr
        // 往往只有正常加载日志、没有错误行，只取 stderr 末尾会掩盖真实退出原因。
        const tail = errorTail.join('\n').trim()
        reject(
          new Error(
            `whisper.cpp 进程异常退出（退出码 ${code}，信号 ${signal}）${tail ? `\n${tail}` : ''}`
          )
        )
      }
    })
  })
}

/** 构建 whisper-stream 参数（实时麦克风流式识别） */
function buildStreamArgs(options: StartRecognizeOptions): string[] {
  const args = ['-m', getWhisperModelPath(options.model), '-l', options.language ?? 'auto']
  args.push('--step', '0')
  args.push('--length', '30000')
  args.push('-vth', '0.6')
  return args
}

ipcMain.handle('whisper:checkModel', (_, model: WhisperModelType): boolean => {
  if (existsSync(getWhisperModelPath(model))) return true
  return false
})

ipcMain.handle('whisper:downloadModel', (event, model: WhisperModelType): Promise<string> => {
  return downloadModel(model, (progress) => {
    event.sender.send('whisper:downloadProgress', progress)
  })
})

ipcMain.handle(
  'whisper:audioRecognize',
  async (_, options: AudioRecognizeOptions, id?: number): Promise<void> => {
    const binary = getWhisperBinaryPath()
    const model = getWhisperModelPath(options.model)

    if (!existsSync(binary)) throw new Error(`whisper.cpp 二进制未找到：${binary}`)
    if (!existsSync(model)) throw new Error(`识别模型尚未下载：${model}`)

    const wavPath = await convertToWav(options.inputAudio, id)
    await runWhisperCli(
      binary,
      buildArgs(options, wavPath),
      (progress) => {
        if (id) setWorkList(id, { progress })
      },
      id
    )
      .catch(async (err) => {
        // 中途停止时清理半成品输出文件（whisper 逐段写出 txt/srt 等）
        if (err instanceof Error && err.message.includes(SINGAL.SIGKILL))
          await rm(`${options.outputFileWithoutExt}.${options.outputExtension}`, { force: true })
        throw err
      })
      .finally(async () => {
        await rm(wavPath, { force: true })
      })
  }
)

ipcMain.handle('whisper:getWhisperModelDir', () => {
  return getWhisperModelDir()
})

ipcMain.handle('whisper:startRecognize', (event, options: StartRecognizeOptions): Promise<void> => {
  const binary = getWhisperStreamBinaryPath()
  const model = getWhisperModelPath(options.model)

  if (!existsSync(binary))
    return Promise.reject(new Error(`whisper-stream 二进制未找到：${binary}`))
  if (!existsSync(model)) return Promise.reject(new Error(`识别模型尚未下载：${model}`))
  if (streamProcess) return Promise.reject(new Error('已有进行中的实时识别'))

  return new Promise<void>((resolve, reject) => {
    const child = spawn(binary, buildStreamArgs(options), { windowsHide: true })

    let pending = ''

    child.stdout.on('data', (chunk: Buffer) => {
      pending += chunk.toString()
      // VAD 模式输出：`[Start speaking]`、`### Transcription N START/END` 标记行，
      // 以及形如 `[00:00:03.000 --> 00:00:05.000]  文本` 的转写行。
      // 按 \r / \n 切分后跳过标记行、剥离时间戳，只转发文本；
      // 只保留末尾未结束的残段，避免长时间识别时 pending 无限增长。
      pending = pending.replace(ANSI_RE, '')
      const segments = pending.split(/[\r\n]/)
      pending = segments.pop() ?? ''

      for (const segment of segments) {
        const raw = segment.trim()
        if (!raw || raw === '[Start speaking]' || raw.startsWith('###')) continue
        const text = raw.replace(TIMESTAMP_RE, '').trim()
        if (text) event.sender.send('whisper:recognizeText', text)
      }
    })

    // whisper-stream 的模型加载日志走 stderr，仅需消费以免阻塞子进程
    child.stderr.on('data', () => {})

    child.once('error', (err) => {
      streamProcess = null
      reject(err)
    })
    child.once('spawn', () => {
      streamProcess = child
      resolve()
    })
    child.once('close', () => {
      if (streamProcess === child) streamProcess = null
    })
  })
})

ipcMain.handle('whisper:stopRecognize', () => {
  streamProcess?.kill('SIGKILL')
  streamProcess = null
})
