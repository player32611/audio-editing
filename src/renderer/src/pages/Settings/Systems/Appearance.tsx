import { Select, Space } from 'antd'
import { useState, useEffect, type ReactNode } from 'react'
import type { Theme } from '../../../../../shared/type'

export default function Appearance(): ReactNode {
  const [theme, setTheme] = useState<Theme>()

  const handleChange = async (value: Theme): Promise<void> => {
    window.theme.set(value)
    setTheme(value)
  }

  useEffect(() => {
    window.theme.get().then(setTheme)
  }, [])

  return (
    <Space>
      主题:
      <Select
        value={theme}
        style={{ width: 120 }}
        onChange={handleChange}
        options={[
          { value: 'dark', label: '深色主题' },
          { value: 'light', label: '浅色主题' },
          { value: 'system', label: '跟随系统' }
        ]}
      />
    </Space>
  )
}
