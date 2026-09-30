import { Breadcrumb } from 'antd'
import { useLocation } from 'react-router'
import type { ReactNode } from 'react'

export default function SettingsBreadcrumb(): ReactNode {
  const location = useLocation()

  return (
    <Breadcrumb
      items={[
        {
          title: 'Home'
        },
        {
          title: 'Application Center'
        },
        {
          title: 'Application List'
        },
        {
          title: 'An Application'
        }
      ]}
    />
  )
}
