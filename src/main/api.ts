import { shell, ipcMain, dialog, OpenDialogOptions } from 'electron'
import fs from 'fs'
import path from 'path'
import type { FileInfo } from '../shared/type'
import { readFile } from 'fs/promises'

ipcMain.handle('api:selectFile', async (_, options: OpenDialogOptions) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: '请选择一个文件',
    ...options
  })

  if (canceled || filePaths.length === 0) return null

  return filePaths[0]
})

ipcMain.handle('api:selectFolder', async (_, options: OpenDialogOptions) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'], // 允许选择文件夹
    title: '请选择一个文件夹',
    ...options
  })

  if (canceled || filePaths.length === 0) return null // 用户取消

  return filePaths[0] // 返回选中的文件夹路径
})

ipcMain.handle('api:openFolder', (_, path: string): Promise<string> => {
  return shell.openPath(path)
})

ipcMain.handle('api:showItemInFolder', async (_, path: string): Promise<boolean> => {
  const exist = fs.existsSync(path)
  if (exist) shell.showItemInFolder(path)
  else throw new Error('文件不存在')
  return exist
})

ipcMain.handle('api:existsSync', async (_, path: string): Promise<boolean> => {
  return fs.existsSync(path)
})

export const parseFilePath = (filePath: string): FileInfo => {
  const ext = path.extname(filePath)
  const fullName = path.basename(filePath)
  const name = path.basename(filePath, ext)

  return {
    name,
    ext: ext.startsWith('.') ? ext.slice(1) : ext,
    fullName,
    dir: path.dirname(filePath)
  }
}

ipcMain.handle('api:parseFilePath', async (_, filePath): Promise<FileInfo> => {
  return parseFilePath(filePath)
})

ipcMain.handle('api:loadImage', async (_, filePath: string): Promise<{ dataUrl: string }> => {
  const ext = parseFilePath(filePath).ext

  const buffer = await readFile(filePath)

  return {
    dataUrl: `data:image/${ext};base64,${buffer.toString('base64')}`
  }
})
