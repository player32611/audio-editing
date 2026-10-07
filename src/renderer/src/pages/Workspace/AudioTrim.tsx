import { Button } from 'antd'
import { useNavigate } from 'react-router'
import { LeftOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

export default function AudioTrim(): ReactNode {
  const navigate = useNavigate()
  return (
    <>
      <Button
        color="default"
        variant="text"
        icon={<LeftOutlined />}
        onClick={() => navigate('/workspace')}
      >
        返回
      </Button>
    </>
  )
}
