import { ipcMain } from 'electron'
import { delimiter, dirname } from 'path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import Ffmpeg from 'fluent-ffmpeg'
import { CutAudioOptions, SetAduioTagOptions } from '../shared/type'
import type { FfprobeData, FfprobeStream } from 'fluent-ffmpeg'
import { parseFilePath } from './api'
import { AUDIO_FILE_EXTENSION } from '../shared/constants'

/**
 * 在打包的构建中，二进制文件位于 app.asar 内，但它们只能从解包的副本中启动
 * 参见 electron-builder.yml 中的 asarUnpack
 * 在开发环境中，路径指向 node_modules，替换操作不会有任何效果
 */
function unpacked(binaryPath: string): string {
  return binaryPath.replace('app.asar', 'app.asar.unpacked')
}

/**
 * 指向捆绑的 FFmpeg/FFprobe 到 @sellmind/video-editor-core
 *
 * 这个库以两种方式调用 FFmpeg：fluent-ffmpeg（会遵循 FFMPEG_PATH / FFPROBE_PATH）
 * 和原生的 `exec('ffmpeg …')` shell 命令（需要二进制文件在 PATH 中）。
 * 同时设置两者可以覆盖所有代码路径，而无需用户自己安装 FFmpeg
 */
export function setupFfmpeg(): void {
  const ffmpegPath = unpacked(ffmpegInstaller.path)
  const ffprobePath = unpacked(ffprobeInstaller.path)

  Ffmpeg.setFfmpegPath(ffmpegPath)
  Ffmpeg.setFfprobePath(ffprobePath)
  process.env.FFMPEG_PATH = ffmpegPath
  process.env.FFPROBE_PATH = ffprobePath

  const binDirs = [dirname(ffmpegPath), dirname(ffprobePath)]
  process.env.PATH = [...binDirs, process.env.PATH ?? ''].join(delimiter)
}

ipcMain.handle(
  'ffmpeg:cutAudio',
  (
    _,
    {
      inputAudio,
      outputAudio,
      audioFormat,
      audioBitrate,
      audioQuality,
      startTime,
      duration
    }: CutAudioOptions
  ) => {
    return new Promise<void>((reslove, reject) => {
      Ffmpeg(inputAudio)
        .setStartTime(startTime)
        .duration(duration)
        .format(audioFormat)
        .audioBitrate(audioBitrate)
        .audioQuality(audioQuality)
        .on('error', () => {
          reject()
        })
        .on('end', () => {
          reslove()
        })
        .save(outputAudio)
    })
  }
)

ipcMain.handle('ffmpeg:getMediaData', (_, path: string) => {
  return new Promise<FfprobeData>((resolve, reject) => {
    Ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      resolve(metadata)
    })
  })
})

ipcMain.handle('ffmpeg:getAudioStream', (_, path: string) => {
  return new Promise<FfprobeStream>((resolve, reject) => {
    Ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      const audio = metadata.streams.find((stream) => stream.codec_type === 'audio')
      if (!audio) {
        reject('无音频轨道')
        return
      }
      resolve(audio)
    })
  })
})

ipcMain.handle('ffmpeg:getAudioCover', (_, path: string) => {
  return new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const chunks: Buffer[] = []

    const command = Ffmpeg(path).outputOptions(['-map 0:v:0', '-c:v mjpeg']).format('image2pipe')

    const stream = command.pipe()

    stream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk))
    })

    stream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    stream.on('error', reject)

    command.on('error', reject)
  })
})

ipcMain.handle('ffmpeg:setAudioTags', (_, options: SetAduioTagOptions): Promise<void> => {
  const {
    inputAudio,
    outputAudio,
    coverPath,
    title,
    artist,
    album_artist,
    album,
    composer,
    genre,
    date,
    track,
    disc
  } = options

  const tags: Record<string, string | number | undefined> = {
    title,
    artist,
    album_artist,
    album,
    composer,
    genre,
    date,
    track,
    disc
  }
  const ext = parseFilePath(inputAudio).ext
  const outputOptions: string[] = []

  for (const [key, value] of Object.entries(tags)) {
    if (value !== undefined) {
      outputOptions.push('-metadata', `${key}=${value}`)
    }
  }
  console.log(ext)
  switch (ext) {
    case AUDIO_FILE_EXTENSION.MP3:
      outputOptions.push('-c:a copy')
      if (coverPath)
        outputOptions.push(
          '-map 0:a:0',
          '-map 1:v:0',
          '-c:v mjpeg',
          '-id3v2_version 3',
          '-disposition:v:0 attached_pic',
          '-metadata:s:v title=Album cover',
          '-metadata:s:v comment=Cover (Front)'
        )
      break
    case AUDIO_FILE_EXTENSION.FLAC:
      break
  }

  return new Promise<void>((resolve, reject) => {
    const work = Ffmpeg(inputAudio)
    if (coverPath) work.input(coverPath)
    work
      .outputOptions(outputOptions)
      .on('error', (error) => {
        reject(error)
      })
      .on('end', () => {
        resolve()
      })
      .save(outputAudio)
  })
})
