import { Flex, Input, Space } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'
import { useState, useEffect, type ReactNode, useCallback } from 'react'

export default function File(): ReactNode {
  const [inputPath, setInputPath] = useState<string>('')
  const [outputPath, setOutputPath] = useState<string>('')

  const onSelectInput = useCallback((): void => {
    window.api.selectFolder({ defaultPath: inputPath }).then((res) => {
      if (res) window.path.set('output', res).then(setInputPath)
    })
  }, [inputPath])

  const onSelectOutput = useCallback((): void => {
    window.api.selectFolder({ defaultPath: outputPath }).then((res) => {
      if (res) window.path.set('output', res).then(setOutputPath)
    })
  }, [outputPath])

  useEffect(() => {
    window.path.get('input').then(setInputPath)
    window.path.get('output').then(setOutputPath)
  }, [])

  return (
    <Space vertical style={{ width: '100%' }}>
      <Flex align="center" gap={10}>
        <div>默认输入目录:</div>
        <Input
          value={inputPath}
          suffix={<FolderOpenOutlined />}
          onClick={onSelectInput}
          style={{ flex: 1 }}
        />
      </Flex>
      <Flex align="center" gap={10}>
        <div>默认输出目录:</div>
        <Input
          value={outputPath}
          suffix={<FolderOpenOutlined />}
          onClick={onSelectOutput}
          style={{ flex: 1 }}
        />
      </Flex>
    </Space>
  )
}
