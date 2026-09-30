import { Card, Flex, FloatButton } from 'antd'
import { AudioOutlined, PlusOutlined, TranslationOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

export default function Workspace(): ReactNode {
  return (
    <>
      <Flex gap="small" wrap style={{ margin: 10 }}>
        <Card>
          <p>任务一</p>
        </Card>
        <Card style={{ width: 300 }}>
          <p>Card content</p>
        </Card>
      </Flex>
      <FloatButton.Group icon={<PlusOutlined />} type="primary" trigger="click">
        <FloatButton
          icon={<AudioOutlined />}
          tooltip={{
            title: '音频提取',
            color: 'blue',
            placement: 'left'
          }}
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
