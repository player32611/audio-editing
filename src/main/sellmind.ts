import { ipcMain } from 'electron'
import { getVoice, GetVoiceOptions } from '@sellmind/video-editor-core'

ipcMain.handle('sellmind:getVoice', (_, options: GetVoiceOptions) => {
  return getVoice(options)
})
