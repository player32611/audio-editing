import { Menu } from 'antd'
import { Link, useLocation } from 'react-router'
import { AppstoreOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { ItemType } from 'antd/es/menu/interface'

export default function LayoutMenu(): ReactNode {
  const location = useLocation()
  const items: ItemType[] = [
    {
      label: <Link to="/">主页</Link>,
      key: '/',
      icon: <HomeOutlined />
    },
    {
      label: <Link to="/workspace">工作台</Link>,
      key: '/workspace',
      icon: <AppstoreOutlined />
    },
    {
      label: <Link to="/settings">设置</Link>,
      key: '/settings',
      icon: <SettingOutlined />
    }
  ]

  return <Menu mode="horizontal" items={items} selectedKeys={[location.pathname]} />
}
