import { Flex, Input } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'
import { useState, useEffect, type ReactNode } from 'react'

export default function File(): ReactNode {
  const [outputPath, setOutputPath] = useState<string>('')

  const onClick = (): void => {
    window.api.selectFolder(outputPath).then((res) => {
      if (res) window.path.set('output', res).then(setOutputPath)
    })
  }

  useEffect(() => {
    window.path.get('output').then(setOutputPath)
  }, [])

  return (
    <Flex align="center" gap={10} style={{ width: '100%' }}>
      <div>默认输出目录:</div>
      <Input
        value={outputPath}
        suffix={<FolderOpenOutlined />}
        onClick={onClick}
        style={{ flex: 1 }}
      />
    </Flex>
  )
}
