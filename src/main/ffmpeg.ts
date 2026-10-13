import { ipcMain } from 'electron'
import { delimiter, dirname } from 'path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import Ffmpeg from 'fluent-ffmpeg'
import { parseFilePath } from './api'
import { AUDIO_FILE_EXTENSION } from '../shared/constants'
import { getCodec, getFormat } from '../shared/utils'
import { setWorkList } from '.'
import type { CutAudioOptions, GetVoiceOptions, SetAduioTagOptions } from '../shared/type'
import type { FfprobeData, FfprobeStream } from 'fluent-ffmpeg'

/**
 * 在打包的构建中，二进制文件位于 app.asar 内，但它们只能从解包的副本中启动
 * 参见 electron-builder.yml 中的 asarUnpack
 * 在开发环境中，路径指向 node_modules，替换操作不会有任何效果
 */
function unpacked(binaryPath: string): string {
  return binaryPath.replace('app.asar', 'app.asar.unpacked')
}

/**
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

ipcMain.handle('ffmpeg:getVoice', (_, options: GetVoiceOptions, id?: number) => {
  return new Promise<void>((resolve, reject) => {
    const work = Ffmpeg(options.inputVideo)
      .noVideo()
      .audioCodec(getCodec(options.audioExtension))
      .format(getFormat(options.audioExtension))
      .audioBitrate(options.audioBitrate)
      .audioQuality(options.audioQuality)
      .setStartTime(options.startTime)
      .duration(options.duration)
      .on('error', (err) => {
        reject(err)
      })
      .on('end', () => {
        resolve()
      })
    if (id) {
      work.on('progress', (progress) => {
        setWorkList(id, { progress: progress.percent })
      })
    }
    work.save(options.outputAudio)
  })
})

ipcMain.handle('ffmpeg:cutAudio', (_, options: CutAudioOptions, id?: number) => {
  return new Promise<void>((reslove, reject) => {
    const work = Ffmpeg(options.inputAudio)
      .audioCodec(getCodec(options.audioExtension))
      .format(getFormat(options.audioExtension))
      .audioBitrate(options.audioBitrate)
      .audioQuality(options.audioQuality)
      .setStartTime(options.startTime)
      .duration(options.duration)
      .on('error', (err) => {
        reject(err)
      })
      .on('end', () => {
        reslove()
      })
    if (id) {
      work.on('progress', (progress) => {
        setWorkList(id, { progress: progress.percent })
      })
    }
    work.save(options.outputAudio)
  })
})

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

ipcMain.handle(
  'ffmpeg:setAudioTags',
  (_, options: SetAduioTagOptions, id?: number): Promise<void> => {
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

    outputOptions.push('-c:a', 'copy')
    if (coverPath) {
      switch (ext) {
        case AUDIO_FILE_EXTENSION.MP3:
          if (coverPath)
            outputOptions.push(
              '-map',
              '0:a:0',
              '-map',
              '1:v:0',
              '-c:v',
              'mjpeg',
              '-id3v2_version',
              '3',
              '-disposition:v:0',
              'attached_pic',
              '-metadata:s:v',
              'title=Album cover',
              '-metadata:s:v',
              'comment=Cover (Front)'
            )
          break
        case AUDIO_FILE_EXTENSION.FLAC:
          outputOptions.push(
            '-map',
            '0:a:0', // 原音频流
            '-map',
            '1:v:0', // 封面图片
            '-c:v',
            'mjpeg', // 封面转码为 JPEG（Windows 资源管理器只稳定识别 JPEG/PNG）
            '-disposition:v:0',
            'attached_pic', // 标记为封面
            '-metadata:s:v',
            'title=Album cover',
            '-metadata:s:v',
            'comment=Cover (front)',
            '-f',
            'flac' // 输出 FLAC
          )
          break
        case AUDIO_FILE_EXTENSION.WAV:
          // WAV(RIFF) 无法内嵌封面：Windows 资源管理器读取的是非标准 id3 块，FFmpeg 写不进去。
          // 若把封面映射为 attached_pic 视频流，WAV muxer 无法写入视频流，
          // 会报 "Error initializing output stream 0:1" / "Could not write header"。
          // 因此只复制音频流与标签信息，不嵌入封面。
          outputOptions.push('-map', '0:a:0')
          break
        case AUDIO_FILE_EXTENSION.AAC:
          // AAC(.aac 为 ADTS 裸流) 无法内嵌封面，只能复制音频流与标签信息。
          outputOptions.push('-map', '0:a:0')
          break
        case AUDIO_FILE_EXTENSION.M4A:
          outputOptions.push(
            '-map',
            '0:a:0',
            '-map',
            '1:v:0',
            '-c:v',
            'mjpeg',
            '-disposition:v:0',
            'attached_pic',
            '-metadata:s:v',
            'title=Album cover',
            '-metadata:s:v',
            'comment=Cover (front)'
          )
          break
        case AUDIO_FILE_EXTENSION.OGG:
          // Ogg muxer 不接受 mjpeg 视频流（不似 FLAC 会把封面缓存进 METADATA_BLOCK_PICTURE），
          // 强行映射封面会报 "Error initializing output stream 0:1"。故只复制音频流与标签。
          outputOptions.push('-map', '0:a:0')
          break
      }
    }

    return new Promise<void>((resolve, reject) => {
      const work = Ffmpeg(inputAudio)
      // 仅 MP3 / FLAC / M4A 支持内嵌封面；WAV / AAC / OGG 不支持，添加封面输入只会产生未使用的第二输入
      if (
        coverPath &&
        ext !== AUDIO_FILE_EXTENSION.WAV &&
        ext !== AUDIO_FILE_EXTENSION.AAC &&
        ext !== AUDIO_FILE_EXTENSION.OGG
      )
        work.input(coverPath)
      if (id) {
        work.on('progress', (progress) => {
          setWorkList(id, { progress: progress.percent })
        })
      }
      work
        .outputOptions(...outputOptions)
        .on('error', (error) => {
          reject(error)
        })
        .on('end', () => {
          resolve()
        })
        .save(outputAudio)
    })
  }
)
