import { Menu } from 'antd'
import { Link, useLocation } from 'react-router'
import { AppstoreOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { ItemType } from 'antd/es/menu/interface'

export const HomeMenu = (): ReactNode => {
  const location = useLocation()
  const items: ItemType[] = [
    {
      label: <Link to="/">Home</Link>,
      key: '/',
      icon: <HomeOutlined />
    },
    {
      label: <Link to="/workspace">Workspace</Link>,
      key: '/workspace',
      icon: <AppstoreOutlined />
    },
    {
      label: <Link to="/settings">Setting</Link>,
      key: '/settings',
      icon: <SettingOutlined />
    }
  ]

  console.log(location.pathname)

  return <Menu mode="horizontal" items={items} selectedKeys={[location.pathname]} />
}
