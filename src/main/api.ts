import { shell, ipcMain, dialog, OpenDialogOptions } from 'electron'

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

ipcMain.handle('api:showItemInFolder', (_, path: string): void => {
  shell.showItemInFolder(path)
})
