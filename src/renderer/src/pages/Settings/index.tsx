import { Layout } from 'antd'
import type { ReactNode } from 'react'

import SettingsBreadcrumb from '@renderer/components/settings/SettingsBreadcrumb'
import SettingsMenu from '@renderer/components/settings/SettingsMenu'
import { Outlet } from 'react-router'

const { Header, Sider, Content } = Layout

export default function Settings(): ReactNode {
  return (
    <Layout style={{ height: '100%' }}>
      <Sider>
        <SettingsMenu />
      </Sider>
      <Layout>
        <Header style={{ padding: 10, height: 'auto' }}>
          <SettingsBreadcrumb />
        </Header>
        <Content style={{ padding: 10 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
