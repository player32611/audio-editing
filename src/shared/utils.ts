import { AudioFileExtension } from './type'

export const getFormat = (extension: AudioFileExtension): string => {
  switch (extension) {
    case 'aac':
      return 'adts'
    case 'm4a':
      return 'ipod'
    default:
      return extension
  }
}

export const getCodec = (extension: AudioFileExtension): string => {
  switch (extension) {
    case 'mp3':
      return 'libmp3lame'
    case 'aac':
      return 'aac'
    case 'm4a':
      return 'aac'
    case 'wav':
      return 'pcm_s16le'
    case 'ogg':
      return 'libvorbis'
    default:
      return extension
  }
}
