import { delimiter, dirname } from 'path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'

/**
 * In a packaged build the binaries live inside app.asar, but they can only be
 * spawned from the unpacked copy (see asarUnpack in electron-builder.yml).
 * In dev the path points into node_modules and the replacement is a no-op.
 */
function unpacked(binaryPath: string): string {
  return binaryPath.replace('app.asar', 'app.asar.unpacked')
}

/**
 * Point the bundled FFmpeg/FFprobe at @sellmind/video-editor-core.
 *
 * The library invokes FFmpeg in two ways: fluent-ffmpeg (honours FFMPEG_PATH /
 * FFPROBE_PATH) and raw `exec('ffmpeg …')` shell commands (needs the binary on
 * PATH). Setting both covers every code path without users installing FFmpeg.
 */
export function setupFfmpeg(): void {
  const ffmpegPath = unpacked(ffmpegInstaller.path)
  const ffprobePath = unpacked(ffprobeInstaller.path)

  process.env.FFMPEG_PATH = ffmpegPath
  process.env.FFPROBE_PATH = ffprobePath

  const binDirs = [dirname(ffmpegPath), dirname(ffprobePath)]
  process.env.PATH = [...binDirs, process.env.PATH ?? ''].join(delimiter)
}
