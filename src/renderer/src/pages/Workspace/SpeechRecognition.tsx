import { Row, Col, Button, Typography } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

const { Text } = Typography

export default function SpeechRecognition(): ReactNode {
  const navigate = useNavigate()

  return (
    <Row align="middle">
      <Col span={8}>
        <Button
          color="default"
          variant="text"
          icon={<LeftOutlined />}
          onClick={() => navigate('/workspace')}
        >
          返回
        </Button>
      </Col>

      <Col span={8} style={{ display: 'flex', justifyContent: 'center' }}>
        <Text strong>语音识别</Text>
      </Col>
    </Row>
  )
}
