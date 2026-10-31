import { Button, Card, Col, Flex, Row, Tag } from 'antd'
import { ReactNode, useCallback, useState } from 'react'
import { GPUDeviceInfo } from '../../../../../shared/type'

export default function Gpu(): ReactNode {
  const [gpuDevices, setGpuDevices] = useState<GPUDeviceInfo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const onCheck = useCallback(() => {
    setIsLoading(true)
    window.api
      .getGPUInfo('complete')
      .then((res) => {
        setGpuDevices(res.gpuDevice)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return (
    <Flex vertical gap={24} style={{ height: '100%', width: '100%' }}>
      <Card title="GPU 列表" style={{ flex: 1 }}>
        {gpuDevices.map((device) => (
          <Card.Grid key={device.deviceId} style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col>{device.deviceString}</Col>
              <Col>
                <Tag color={device.active ? 'success' : 'default'}>
                  {device.active ? '启用' : '停用'}
                </Tag>
              </Col>
            </Row>
            {device.driverVendor ? <Row>供应商: {device.driverVendor}</Row> : null}
            {device.driverVersion ? <Row>显卡驱动版本: {device.driverVersion}</Row> : null}
          </Card.Grid>
        ))}
      </Card>

      <Flex justify="center" style={{ width: '100%' }}>
        <Button type="primary" onClick={onCheck} disabled={isLoading} loading={isLoading}>
          {isLoading ? '检测中' : 'GPU 检测'}
        </Button>
      </Flex>
    </Flex>
  )
}
