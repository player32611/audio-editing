import { shell, ipcMain, dialog, OpenDialogOptions } from 'electron'
import { copyFile, createWriteStream, existsSync, unlink } from 'fs'
import { join, basename, extname, dirname } from 'path'
import { readFile } from 'fs/promises'
import { setInstanceList } from './work'
import type { FileInfo } from '../shared/type'

export const parseFilePath = (filePath: string): FileInfo => {
  const ext = extname(filePath)
  const fullName = basename(filePath)
  const name = basename(filePath, ext)

  return {
    name,
    ext: ext.startsWith('.') ? ext.slice(1) : ext,
    fullName,
    dir: dirname(filePath)
  }
}

export const deleteFile = (filePath: string): void => {
  if (!existsSync(filePath)) return
  unlink(filePath, () => {})
}

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
  const exist = existsSync(path)
  if (exist) shell.showItemInFolder(path)
  else throw new Error('文件不存在')
  return exist
})

ipcMain.handle('api:existsSync', async (_, path: string): Promise<boolean> => {
  return existsSync(path)
})

ipcMain.handle('api:parseFilePath', async (_, filePath): Promise<FileInfo> => {
  return parseFilePath(filePath)
})

ipcMain.handle('api:readFile', async (_, filePath: string) => {
  const buffer = await readFile(filePath)

  return new Uint8Array(buffer)
})

ipcMain.handle('api:loadImage', async (_, filePath: string): Promise<{ dataUrl: string }> => {
  const ext = parseFilePath(filePath).ext

  const buffer = await readFile(filePath)

  return {
    dataUrl: `data:image/${ext};base64,${buffer.toString('base64')}`
  }
})

ipcMain.handle('api:deleteFile', (_, path: string) => {
  deleteFile(path)
})

ipcMain.handle('api:joinPath', (_, ...path: string[]) => {
  return join(...path)
})

ipcMain.handle('api:openExternal', (_, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('api:copyFile', (_, source: string, target: string) => {
  copyFile(source, target, () => {})
})

ipcMain.handle('api:writeFile', (_, filePath: string, content: string, id?: number) => {
  return new Promise<void>((resolve, reject) => {
    const work = createWriteStream(filePath, { encoding: 'utf8' })

    work.on('finish', () => {
      resolve()
    })
    work.on('error', (err) => {
      reject(err)
    })
    if (id) {
      work.on('open', () => {
        setInstanceList(id, {
          kill: (signal) => {
            work.destroy(new Error(String(signal)))
          }
        })
      })
    }

    work.write(content)
    work.end()
  })
})
