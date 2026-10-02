import { Card, Flex } from 'antd'
import type { ReactNode } from 'react'

export default function List(): ReactNode {
  return (
    <Flex gap="small" wrap style={{ margin: 10 }}>
      <Card>
        <p>任务一</p>
      </Card>
      <Card style={{ width: 300 }}>
        <p>Card content</p>
      </Card>
    </Flex>
  )
}
