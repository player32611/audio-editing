import { AUDIO_CODEC } from './constants'
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
      return AUDIO_CODEC.LIBMP3LAME
    case 'aac':
      return AUDIO_CODEC.AAC
    case 'm4a':
      return AUDIO_CODEC.AAC
    case 'wav':
      return AUDIO_CODEC.PCM_S16LE
    case 'ogg':
      return AUDIO_CODEC.LIBVORBIS
    default:
      return extension
  }
}
