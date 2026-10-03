import { Space } from 'antd'

import type { ReactNode } from 'react'
import { Outlet } from 'react-router'

export default function Workspace(): ReactNode {
  return (
    <>
      <Space
        orientation="vertical"
        style={{
          padding: 12,
          width: '100%'
        }}
      >
        <Outlet />
      </Space>
    </>
  )
}
