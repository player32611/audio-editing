import {
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Form,
  Input,
  Radio,
  Flex,
  Spin,
  InputNumber,
  Slider,
  type FormProps
} from 'antd'
import { useNavigate } from 'react-router'
import { LeftOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTools } from '@renderer/hooks'
import { AUDIO_FILE_EXTENSION } from '../../../../shared/constants'
import { AudioWave, AudioWaveRef } from '@renderer/components/common/AudioWave'
import type { AudioFileExtension } from '../../../../shared/type'
import type { FfprobeStream } from 'fluent-ffmpeg'

interface FieldType {
  inputAudio: string
  outputPath: string
  outputName: string
  audioExtension: AudioFileExtension
  audioBitrate: number
  audioQuality: number
  audioRange: [number, number]
}

const { Text } = Typography

export default function AudioTrim(): ReactNode {
  const [form] = Form.useForm<FieldType>()
  const [inputData, setInputData] = useState<FfprobeStream | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)

  const waveRef = useRef<AudioWaveRef | null>(null)

  const navigate = useNavigate()
  const { cutAudio } = useTools()

  const onSelectInput = useCallback(async (): Promise<void> => {
    if (isSelecting) return

    setIsSelecting(true)
    const defaultInput = form.getFieldValue('inputAudio') || (await window.path.get('input'))
    const inputPath = await window.api.selectFile({
      defaultPath: defaultInput,
      filters: [{ name: '音频', extensions: Object.values(AUDIO_FILE_EXTENSION) }]
    })
    setIsSelecting(false)
    if (!inputPath) return

    setIsLoading(true)
    const inputName = await window.api.parseFilePath(inputPath)
    const data = await window.ffmpeg.getAudioStream(inputPath)
    form.setFieldsValue({
      inputAudio: inputPath,
      outputName: inputName.name
    })
    setInputData(data)
    setIsLoading(false)
  }, [form, isSelecting])

  const onSelectOutput = useCallback(async (): Promise<void> => {
    if (isSelecting) return

    setIsSelecting(true)
    const outputPath = await window.api.selectFolder({
      defaultPath: form.getFieldValue('outputPath') || undefined
    })
    if (outputPath) form.setFieldValue('outputPath', outputPath)
    setIsSelecting(false)
  }, [form, isSelecting])

  const onPlayPause = useCallback(() => {
    if (!waveRef.current) return

    setIsPlaying(waveRef.current?.playPause())
  }, [waveRef])

  const onReset = useCallback(() => {
    setInputData(null)
    // setIsPlaying(false)
    form.resetFields()
    window.path.get('output').then((res) => {
      form.setFieldValue('outputPath', res)
    })
  }, [form])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    async ({
      inputAudio,
      outputPath,
      outputName,
      audioExtension,
      audioBitrate,
      audioQuality,
      audioRange
    }) => {
      setIsLoading(true)
      const fullPath = await window.api.joinPath(outputPath, `${outputName}.${audioExtension}`)
      await cutAudio({
        inputAudio,
        outputAudio: fullPath,
        audioExtension,
        audioBitrate: `${audioBitrate}k`,
        audioQuality,
        startTime: audioRange[0],
        duration: audioRange[1] - audioRange[0]
      })
      setIsLoading(false)
      navigate('/workspace')
    },
    [cutAudio, navigate]
  )

  useEffect(() => {
    window.path.get('output').then((res) => {
      form.setFieldValue('outputPath', res)
      setIsLoading(false)
    })
  }, [form])

  return (
    <>
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
          <Text strong>音频裁剪</Text>
        </Col>
      </Row>

      <Divider />

      <Form
        name="config"
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
      >
        <Form.Item<FieldType>
          name="inputAudio"
          label="输入文件"
          rules={[{ required: true, message: '请选择输入文件' }]}
        >
          <Input suffix={<FolderOpenOutlined onClick={onSelectInput} />} onClick={onSelectInput} />
        </Form.Item>

        <Form.Item<FieldType>
          name="outputPath"
          label="输出路径"
          rules={[{ required: true, message: '请选择输出目录' }]}
        >
          <Input
            suffix={<FolderOpenOutlined onClick={onSelectOutput} />}
            onClick={onSelectOutput}
          />
        </Form.Item>

        <Form.Item<FieldType>
          name="outputName"
          label="输出文件名"
          rules={[
            {
              pattern: /^[^\\/:*?"<>|]+$/,
              message: '文件名不能包含 \\ / : * ? " < > | 等特殊字符'
            },
            { required: true, message: '请设置输出文件名' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType> name="audioExtension" label="音频格式" initialValue="mp3">
          <Radio.Group>
            {Object.values(AUDIO_FILE_EXTENSION).map((val) => (
              <Radio.Button value={val} key={val}>
                {val}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item<FieldType> name="audioQuality" label="音频质量" initialValue={4}>
          <Slider
            max={9}
            min={0}
            marks={{
              0: '高',
              4: '中',
              9: '低'
            }}
            tooltip={{ formatter: null }}
          />
        </Form.Item>

        <Form.Item<FieldType> name="audioBitrate" label="音频码率" initialValue={192}>
          <InputNumber suffix="k" changeOnWheel />
        </Form.Item>

        <Form.Item<FieldType> name="audioRange" label="截取范围" initialValue={[0, 0]}>
          <AudioWave
            url={form.getFieldValue('inputAudio')}
            ref={waveRef}
            onPlayChange={(isPlaying) => setIsPlaying(isPlaying)}
          />
        </Form.Item>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Flex justify="center" align="center" gap={10}>
            <Button htmlType="button" type="primary" onClick={onPlayPause} disabled={!inputData}>
              {isPlaying ? '暂停' : '预览'}
            </Button>
            <Button htmlType="button" onClick={onReset}>
              重置
            </Button>
            <Button htmlType="submit" type="primary">
              导出
            </Button>
          </Flex>
        </Form.Item>
      </Form>
      <Spin spinning={isLoading} fullscreen />
    </>
  )
}
