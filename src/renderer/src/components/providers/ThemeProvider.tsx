import { ConfigProvider, theme } from 'antd'
import { ReactNode, useEffect, useState } from 'react'

export const ThemeProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    window.darkMode.get().then(setIsDark)

    const unsubscribe = window.darkMode.onChanged((dark) => {
      setIsDark(dark)
    })

    return unsubscribe
  }, [])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm
      }}
    >
      {children}
    </ConfigProvider>
  )
}
