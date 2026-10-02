import { ElectronAPI } from '@electron-toolkit/preload'
import { Theme, Path } from '../shared/type'

export {}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFolder: (defaultPath: string) => Promise<string>
    }
    theme: {
      set: (theme: Theme) => Promise<Theme>
      get: () => Promise<Theme>
      isDark: () => Promise<boolean>
      onChanged: (callback: (isDark: boolean) => void) => () => void
    }
    path: {
      set: (type: Path, path: string) => Promise<string>
      get: (type: Path) => Promise<string>
    }
  }
}
