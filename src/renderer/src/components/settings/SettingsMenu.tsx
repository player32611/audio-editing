import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Menu } from 'antd'
import type { ReactNode } from 'react'
import type { MenuProps } from 'antd'

interface LevelKeysProps {
  key?: string
  children?: LevelKeysProps[]
}

const items: Required<MenuProps>['items'][number][] = [
  {
    key: 'system',
    label: '系统',
    children: [
      { key: '/settings/appearance', label: '外观' },
      { key: '/settings/file', label: '文件' }
    ]
  }
]

export default function SettingsMenu(): ReactNode {
  const [stateOpenKeys, setStateOpenKeys] = useState<string[]>([])
  const navigate = useNavigate()

  const getLevelKeys = (items1: LevelKeysProps[]): Record<string, number> => {
    const key: Record<string, number> = {}
    const func = (items2: LevelKeysProps[], level = 1): void => {
      items2.forEach((item) => {
        if (!item) return
        if (item.key) key[item.key] = level

        if (item.children) {
          func(item.children, level + 1)
        }
      })
    }
    func(items1)
    return key
  }

  const levelKeys = getLevelKeys(items as LevelKeysProps[])

  const onOpenChange = (openKeys: string[]): void => {
    const currentOpenKey = openKeys.find((key) => !stateOpenKeys.includes(key))
    // open
    if (currentOpenKey !== undefined) {
      const repeatIndex = openKeys
        .filter((key) => key !== currentOpenKey)
        .findIndex((key) => levelKeys[key] === levelKeys[currentOpenKey])

      setStateOpenKeys(
        openKeys
          // remove repeat key
          .filter((_, index) => index !== repeatIndex)
          // remove current level all child
          .filter((key) => levelKeys[key] <= levelKeys[currentOpenKey])
      )
    } else {
      // close
      setStateOpenKeys(openKeys)
    }
  }

  return (
    <>
      <Menu
        items={items}
        mode="inline"
        openKeys={stateOpenKeys}
        onOpenChange={onOpenChange}
        onClick={(e) => navigate(e.key)}
        style={{ width: 192, height: '100%' }}
      />
    </>
  )
}
