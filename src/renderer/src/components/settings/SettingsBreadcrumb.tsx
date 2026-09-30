import { Breadcrumb } from 'antd'
import { useLocation } from 'react-router'
import { getBreadcrumb } from '@renderer/utils'
import type { ReactNode } from 'react'

export default function SettingsBreadcrumb(): ReactNode {
  const location = useLocation()

  return <Breadcrumb items={getBreadcrumb(location.pathname)} />
}
