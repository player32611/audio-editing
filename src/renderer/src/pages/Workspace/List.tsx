import { Button, Card, Empty, Flex, FloatButton } from 'antd'
import {
  AudioOutlined,
  DeleteOutlined,
  PlusOutlined,
  ScissorOutlined,
  TranslationOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import type { ReactNode } from 'react'

export default function List(): ReactNode {
  const navigate = useNavigate()

  return (
    <>
      <Flex justify="flex-end">
        <Button type="primary" icon={<DeleteOutlined />} danger>
          清空
        </Button>
      </Flex>
      <Empty />
      {/* <Flex gap="small" wrap style={{ margin: 10 }}>
        <Card>
          <p>任务一</p>
        </Card>
        <Card style={{ width: 300 }}>
          <p>Card content</p>
        </Card>
      </Flex> */}
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
          icon={<ScissorOutlined />}
          tooltip={{
            title: '音频裁剪',
            color: 'blue',
            placement: 'left'
          }}
        // onClick={() => navigate('/workspace/extract')}
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
    </>
  )
}
