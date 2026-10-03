import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  dialog,
  OpenDialogOptions
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'
import { getVoice, GetVoiceOptions } from '@sellmind/video-editor-core'
import { STORE_KEY } from '../shared/constants'
import type { Path, Theme } from '../shared/type'
import { setupFfmpeg } from './ffmpeg'

// Make the bundled FFmpeg/FFprobe available to @sellmind/video-editor-core.
setupFfmpeg()

let mainWindow: BrowserWindow | null = null
const store = new Store<Record<string, string>>()

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.webContents.send('theme:changed', store.get(STORE_KEY.THEME) === 'dark')
    nativeTheme.themeSource = store.get(STORE_KEY.THEME) as Theme
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('api:selectFolder', async (_, options: OpenDialogOptions) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'], // 允许选择文件夹
    title: '请选择一个文件夹',
    ...options
  })

  if (canceled || filePaths.length === 0) return null // 用户取消

  return filePaths[0] // 返回选中的文件夹路径
})

ipcMain.handle('api:selectFile', async (_, options: OpenDialogOptions) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: '请选择一个文件',
    ...options
  })

  if (canceled || filePaths.length === 0) return null

  return filePaths[0]
})

ipcMain.handle('theme:set', (_, theme: Theme) => {
  nativeTheme.themeSource = theme
  store.set(STORE_KEY.THEME, theme)
  return nativeTheme.themeSource
})

ipcMain.handle('theme:isDark', () => {
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('theme:get', () => {
  return nativeTheme.themeSource
})

ipcMain.handle('path:set', (_, type: Path, path: string) => {
  store.set(`${STORE_KEY.PATH}-${type}`, path)
  return store.get(`${STORE_KEY.PATH}-${type}`)
})

ipcMain.handle('path:get', (_, type: Path) => {
  let res = store.get(`${STORE_KEY.PATH}-${type}`)
  if (!res) {
    switch (type) {
      case 'input':
        res = app.getPath('downloads')
        break
      case 'output':
        res = app.getPath('downloads')
        break
    }
    store.set(`${STORE_KEY.PATH}-${type}`, res)
  }
  return res
})

ipcMain.handle('sellmind:getVoice', (_, options: GetVoiceOptions) => {
  return getVoice(options)
})

nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
