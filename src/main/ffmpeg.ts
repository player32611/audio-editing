import { ipcMain } from 'electron'
import { delimiter, dirname } from 'path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import Ffmpeg from 'fluent-ffmpeg'

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

ipcMain.handle('ffmpeg:cutAudio', (_, options) => {
  // return Ffmpeg().videoCodec
})

ipcMain.handle('ffmpeg:getVideoData', (_, path: string) => {
  return new Promise<Ffmpeg.FfprobeFormat>((resolve, reject) => {
    Ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      resolve(metadata.format)
    })
  })
})
