import { FloatButton, Space } from 'antd'
import { AudioOutlined, PlusOutlined, TranslationOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'

export default function Workspace(): ReactNode {
  const navigate = useNavigate()
  const location = useLocation()
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
      {location.pathname == '/workspace' ? (
        <FloatButton.Group icon={<PlusOutlined />} type="primary" trigger="click">
          <FloatButton
            icon={<AudioOutlined />}
            tooltip={{
              title: '音频提取',
              color: 'blue',
              placement: 'left'
            }}
            onClick={() => navigate('/workspace/extract')}
          />
          <FloatButton
            icon={<TranslationOutlined />}
            tooltip={{
              title: '汉英转译',
              color: 'blue',
              placement: 'left'
            }}
          />
        </FloatButton.Group>
      ) : (
        <></>
      )}
    </>
  )
}
