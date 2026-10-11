import { Button, Flex, Input, Space } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'
import { useState, useEffect, type ReactNode, useCallback } from 'react'

export default function File(): ReactNode {
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [inputPath, setInputPath] = useState<string>('')
  const [outputPath, setOutputPath] = useState<string>('')
  const [coverPath, setCoverPath] = useState<string>('')

  const onSelectInput = useCallback(() => {
    if (isSelecting) return

    setIsSelecting(true)
    window.api
      .selectFolder({ defaultPath: inputPath })
      .then((res) => {
        if (res) window.path.set('input', res).then(setInputPath)
      })
      .finally(() => {
        setIsSelecting(false)
      })
  }, [isSelecting, inputPath])

  const onSelectOutput = useCallback(() => {
    if (isSelecting) return

    setIsSelecting(true)
    window.api
      .selectFolder({ defaultPath: outputPath })
      .then((res) => {
        if (res) window.path.set('output', res).then(setOutputPath)
      })
      .finally(() => {
        setIsSelecting(false)
      })
  }, [isSelecting, outputPath])

  const onSelectCover = useCallback(() => {
    if (isSelecting) return

    setIsSelecting(true)
    window.api
      .selectFolder({ defaultPath: coverPath })
      .then((res) => {
        if (res) window.path.set('cover', res).then(setCoverPath)
      })
      .finally(() => {
        setIsSelecting(false)
      })
  }, [isSelecting, coverPath])

  useEffect(() => {
    window.path.get('input').then(setInputPath)
    window.path.get('output').then(setOutputPath)
    window.path.get('cover').then(setCoverPath)
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
        <Button type="link" onClick={() => window.api.openFolder(inputPath)}>
          打开文件夹
        </Button>
      </Flex>
      <Flex align="center" gap={10}>
        <div>默认输出目录:</div>
        <Input
          value={outputPath}
          suffix={<FolderOpenOutlined />}
          onClick={onSelectOutput}
          style={{ flex: 1 }}
        />
        <Button type="link" onClick={() => window.api.openFolder(outputPath)}>
          打开文件夹
        </Button>
      </Flex>
      <Flex align="center" gap={10}>
        <div>默认封面目录:</div>
        <Input
          value={coverPath}
          suffix={<FolderOpenOutlined />}
          onClick={onSelectCover}
          style={{ flex: 1 }}
        />
        <Button type="link" onClick={() => window.api.openFolder(coverPath)}>
          打开文件夹
        </Button>
      </Flex>
    </Space>
  )
}
