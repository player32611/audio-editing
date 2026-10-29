import { Space, Flex, Input, Button, Radio } from 'antd'
import { ReactNode, useEffect, useState } from 'react'
import { WHISPER_MODEL_TYPE } from '../../../../../shared/constants'
import { WhisperModelType } from '../../../../../shared/type'

export default function Whisper(): ReactNode {
  const [modelStoragePath, setModelStoragePath] = useState<string>('')
  const [downloadModel, setDownloadModel] = useState<WhisperModelType[]>([])

  useEffect(() => {
    window.whisper.getWhisperModelDir().then(setModelStoragePath)
    window.whisper.getDownloadModelList().then(setDownloadModel)
  }, [])

  return (
    <Space vertical style={{ width: '100%' }}>
      <Flex align="center" gap={10}>
        <div>模型存储目录:</div>
        <Space.Compact style={{ flex: 1 }}>
          <Input value={modelStoragePath} style={{ flex: 1 }} readOnly />
        </Space.Compact>
        <Button type="link" onClick={() => window.api.openFolder(modelStoragePath)}>
          打开文件夹
        </Button>
      </Flex>

      <Flex align="center" gap={10}>
        <div>已下载模型:</div>
        <Radio.Group value={null}>
          {Object.values(WHISPER_MODEL_TYPE).map((val) => (
            <Radio.Button value={val} key={val} disabled={!downloadModel.includes(val)}>
              {val}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Flex>
    </Space>
  )
}
