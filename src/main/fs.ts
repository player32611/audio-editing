import { ipcMain } from 'electron'
import fs from 'fs'

ipcMain.handle('fs:existsSync', async (_, path: string): Promise<boolean> => {
  return fs.existsSync(path)
})
