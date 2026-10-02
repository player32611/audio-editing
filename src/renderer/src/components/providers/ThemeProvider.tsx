import { ConfigProvider, theme } from 'antd'
import { ReactNode, useEffect, useState } from 'react'
import zhCN from 'antd/locale/zh_CN'

export default function ThemeProvider({ children }: { children: ReactNode }): ReactNode {
  const [useDark, setUseDark] = useState<boolean>()

  useEffect(() => {
    window.theme.isDark().then(setUseDark)

    const unsubscribe = window.theme.onChanged((isDark) => {
      setUseDark(isDark)
    })

    return unsubscribe
  }, [])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: useDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        components: {
          Layout: {
            headerBg: 'transparent',
            bodyBg: 'transparent',
            siderBg: 'transparent'
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  )
}
