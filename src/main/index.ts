import { app, shell, BrowserWindow, nativeTheme, Tray, nativeImage, Menu } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { STORE_KEY } from '../shared/constants'
import type { Theme } from '../shared/type'

import { setupFfmpeg } from './ffmpeg'
import { initDatabase, renewStatus, selectStatus, updateWorkHistory } from './database'
import { initStore } from './store'
import { getAllWorkList } from './work'

setupFfmpeg()

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
const store = initStore()

function createWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
    return
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 760,
    minWidth: 900,
    minHeight: 760,
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

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
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

function createTray(): void {
  if (tray) return

  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'resources', 'icon.png')
    : join(app.getAppPath(), 'resources', 'icon.png')

  const icon = nativeImage.createFromPath(iconPath)

  if (icon.isEmpty()) {
    throw new Error(`无法加载托盘图标：${iconPath}`)
  }

  tray = new Tray(icon)
  tray.setToolTip('Audio Editing')

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '退出程序',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )

  tray.on('click', createWindow)
  tray.on('double-click', createWindow)
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
  renewStatus()

  createWindow()
  createTray()

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

app.on('before-quit', async () => {
  if (!mainWindow) return

  const workList = getAllWorkList()
  const statusId = selectStatus('已中断')
  workList.forEach((_, id) => {
    updateWorkHistory(id, { statusId })
  })
})

export const sendMessage = (channel: string, ...args: unknown[]): void => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.webContents.isDestroyed()) return

  mainWindow.webContents.send(channel, ...args)
}

// 在这个文件里，你可以加入你应用其余的特定主进程代码
// 你也可以把它们放在不同的文件里，然后在这里引入。
import './api'
import './whisper'
