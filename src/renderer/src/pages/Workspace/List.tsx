import { Button, Card, Empty, Flex, FloatButton, Tag, Typography } from 'antd'
import {
  AudioOutlined,
  DeleteOutlined,
  PlusOutlined,
  ScissorOutlined,
  TranslationOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useEffect, useState, type ReactNode } from 'react'
import { getStatusColor } from '@renderer/utils'
import dayjs from 'dayjs'
import type { WorkHistoryUnion } from '../../../../shared/type'

const { Paragraph } = Typography

export default function List(): ReactNode {
  const [list, setList] = useState<WorkHistoryUnion[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    window.database.selectWorkHistory().then(setList)
  }, [])

  return (
    <>
      <Flex justify="flex-end">
        <Button type="primary" icon={<DeleteOutlined />} danger>
          清空列表
        </Button>
      </Flex>

      {list.length ? (
        <Flex gap="small" wrap style={{ margin: 10 }}>
          {list.map((item) => (
            <Card
              key={item.id}
              title={item.typeName}
              extra={<Tag color={getStatusColor(item.statusName)}>{item.statusName}</Tag>}
              actions={[<DeleteOutlined key="delete" />]}
            >
              <Paragraph>{dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')}</Paragraph>
              <Paragraph
                style={{ width: 200 }}
                ellipsis={{
                  rows: 1
                }}
              >
                {item.name}
              </Paragraph>
            </Card>
          ))}
        </Flex>
      ) : (
        <Empty />
      )}

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
