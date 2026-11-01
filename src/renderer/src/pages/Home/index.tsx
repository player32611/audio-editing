import { SnippetsOutlined } from '@ant-design/icons'
import { Col, Divider, Row, Space, Statistic } from 'antd'
import { ReactNode, useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'

export default function Home(): ReactNode {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [workCount, setWorkCount] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const startTime = new Date()
    startTime.setHours(0, 0, 0, 0)
    const endTime = new Date()
    endTime.setHours(24, 0, 0, 0)

    Promise.all([
      window.database.selectWorkHistoryByTime(startTime, endTime).then((res) => {
        setWorkCount(res.length)
      })
    ]).finally(() => {
      setIsLoading(false)
    })

    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <Space
      orientation="vertical"
      style={{
        padding: 24,
        width: '100%'
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="当前时间"
            value={currentTime.getTime()}
            formatter={() => dayjs(currentTime).format('HH:mm:ss')}
            loading={isLoading}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="今日工作量"
            prefix={<SnippetsOutlined />}
            value={workCount}
            loading={isLoading}
          />
        </Col>
      </Row>

      <Divider />
    </Space>
  )
}
