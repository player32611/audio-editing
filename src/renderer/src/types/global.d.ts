export {}

declare global {
  interface Window {
    darkMode: {
      toggle: () => Promise<boolean>
      system: () => Promise<boolean>
      get: () => Promise<boolean>
      onChanged: (callback: (isDark: boolean) => void) => () => void
    }
  }
}
