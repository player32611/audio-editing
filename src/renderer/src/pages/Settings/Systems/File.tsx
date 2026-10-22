import { Button, Flex, Input, Space } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'
import { useState, useEffect, type ReactNode, useCallback } from 'react'

export default function File(): ReactNode {
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [inputPath, setInputPath] = useState<string>('')
  const [outputPath, setOutputPath] = useState<string>('')
  const [coverPath, setCoverPath] = useState<string>('')
  const [userDataPath, setUserDataPath] = useState<string>('')

  const onChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      window.path.set('input', e.target.value).then(setInputPath)
    },
    []
  )

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

  const onChangeOutput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      window.path.set('output', e.target.value).then(setOutputPath)
    },
    []
  )

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

  const onChangeCover = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      window.path.set('cover', e.target.value).then(setCoverPath)
    },
    []
  )

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
    window.path.getUserData().then(setUserDataPath)
  }, [])

  return (
    <Space vertical style={{ width: '100%' }}>
      <Flex align="center" gap={10}>
        <div>默认输入目录:</div>
        <Space.Compact style={{ flex: 1 }}>
          <Input value={inputPath} onChange={onChangeInput} style={{ flex: 1 }} />
          <Button icon={<FolderOpenOutlined />} onClick={onSelectInput} />
        </Space.Compact>
        <Button type="link" onClick={() => window.api.openFolder(inputPath)}>
          打开文件夹
        </Button>
      </Flex>

      <Flex align="center" gap={10}>
        <div>默认输出目录:</div>
        <Space.Compact style={{ flex: 1 }}>
          <Input value={outputPath} onChange={onChangeOutput} style={{ flex: 1 }} />
          <Button icon={<FolderOpenOutlined />} onClick={onSelectOutput} />
        </Space.Compact>
        <Button type="link" onClick={() => window.api.openFolder(outputPath)}>
          打开文件夹
        </Button>
      </Flex>

      <Flex align="center" gap={10}>
        <div>默认封面目录:</div>
        <Space.Compact style={{ flex: 1 }}>
          <Input value={coverPath} onChange={onChangeCover} style={{ flex: 1 }} />
          <Button icon={<FolderOpenOutlined />} onClick={onSelectCover} />
        </Space.Compact>
        <Button type="link" onClick={() => window.api.openFolder(coverPath)}>
          打开文件夹
        </Button>
      </Flex>

      <Flex align="center" gap={10}>
        <div>应用数据目录:</div>
        <Space.Compact style={{ flex: 1 }}>
          <Input value={userDataPath} style={{ flex: 1 }} readOnly />
        </Space.Compact>
        <Button type="link" onClick={() => window.api.openFolder(userDataPath)}>
          打开文件夹
        </Button>
      </Flex>
    </Space>
  )
}
