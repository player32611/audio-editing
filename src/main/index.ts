import { app, shell, BrowserWindow, nativeTheme, ipcMain, dialog } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { STORE_KEY } from '../shared/constants'
import type { Theme, WorkStatus } from '../shared/type'
import { setupFfmpeg } from './ffmpeg'
import { initDatabase, selectStatus, updateWorkHistory } from './database'
import { initStore } from './store'

// Make the bundled FFmpeg/FFprobe available to @sellmind/video-editor-core.
setupFfmpeg()

let mainWindow: BrowserWindow | null = null
const store = initStore()
const workList = new Map<number, WorkStatus>()

function createWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
    return
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    minWidth: 900,
    minHeight: 750,
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

  mainWindow.on('close', async (event) => {
    if (!mainWindow) return
    if (!workList.size) return

    event.preventDefault()

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: '确认退出',
      message: `还有 ${workList.size} 个任务正在进行，确定要退出应用吗？`,
      buttons: ['取消', '退出'],
      defaultId: 0,
      cancelId: 0
    })

    if (response === 1) {
      const statusId = selectStatus('已中断')
      workList.forEach((_, id) => {
        updateWorkHistory(id, { statusId })
      })
      mainWindow.destroy()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 基于 electron-vite CLI 的渲染器热模块替换（HMR）
  // 开发时加载远程 URL，生产时加载本地 HTML 文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }

      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(createWindow)
}

nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors)
})

ipcMain.handle('work:set', (_, id: number, work: WorkStatus): void => {
  workList.set(id, work)
  mainWindow?.webContents.send('work:changed')
})

ipcMain.handle('work:get', (_, id: number): WorkStatus | null => {
  const res = workList.get(id)
  if (res) return res
  return null
})

ipcMain.handle('work:getAll', (): { id: number; status: WorkStatus }[] => {
  return Array.from(workList, ([key, value]) => ({ id: key, status: value }))
})

ipcMain.handle('work:delete', (_, id: number) => {
  workList.delete(id)
  mainWindow?.webContents.send('work:changed')
})

// 当 Electron 完成时会调用这个方法
// 初始化完成，可以创建浏览器窗口了
// 有些 API 只有在这个事件发生后才能使用
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDatabase()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都关闭时退出，但在 macOS 上除外。在那边，这是很常见的
// 让应用程序及其菜单栏保持活跃，直到用户退出
// 明确地使用 Cmd + Q
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 在这个文件里，你可以加入你应用其余的特定主进程代码
// 你也可以把它们放在不同的文件里，然后在这里引入。
import './api'
import './fs'
import './sellmind'
