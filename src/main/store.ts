import { app, ipcMain, nativeTheme } from 'electron'
import Store from 'electron-store'
import { STORE_KEY } from '../shared/constants'
import type { Theme, Path } from '../shared/type'

let store: Store<Record<string, string>> | null = null

export const initStore = (): Store<Record<string, string>> => {
  if (store) return store

  store = new Store<Record<string, string>>()

  return store
}

ipcMain.handle('theme:set', (_, theme: Theme): Theme => {
  if (!store) throw new Error('本地 store 存储未初始化')

  nativeTheme.themeSource = theme
  store.set(STORE_KEY.THEME, theme)
  return nativeTheme.themeSource
})

ipcMain.handle('theme:isDark', (): boolean => {
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('theme:get', (): Theme => {
  return nativeTheme.themeSource
})

ipcMain.handle('path:set', (_, type: Path, path: string): string => {
  if (!store) throw new Error('本地 store 存储未初始化')

  store.set(`${STORE_KEY.PATH}-${type}`, path)
  return store.get(`${STORE_KEY.PATH}-${type}`) as string
})

ipcMain.handle('path:get', (_, type: Path): string => {
  if (!store) throw new Error('本地 store 存储未初始化')

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
  return res as string
})
