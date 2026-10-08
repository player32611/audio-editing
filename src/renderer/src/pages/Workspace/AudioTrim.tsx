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
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useFfmpeg } from '@renderer/hooks/useFfmpeg'
import { formatSeconds } from '@renderer/utils'
import type { AudioFileExtension } from '../../../../shared/type'
import type { FfprobeStream } from 'fluent-ffmpeg'
import { AUDIO_FILE_EXTENSION } from '../../../../shared/constants'

interface FieldType {
  inputAudio: string
  outputPath: string
  outputName: string
  audioFormat: AudioFileExtension
  audioBitrate: number
  audioQuality: number
  audioRange: [number, number]
}

const { Text } = Typography

export default function AudioTrim(): ReactNode {
  const [form] = Form.useForm<FieldType>()
  const [inputData, setInputData] = useState<FfprobeStream | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const navigate = useNavigate()
  const { cutAudio } = useFfmpeg()

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
    form.setFieldValue('inputAudio', inputPath)
    form.setFieldValue('outputName', inputName.name)
    const data = await window.ffmpeg.getAudioData(inputPath)
    form.setFieldValue('audioRange', [0, data.duration || 0])
    setInputData(data)
    setIsLoading(false)
  }, [form, isSelecting])

  const onSelectOutput = useCallback(async (): Promise<void> => {
    if (isSelecting) return

    setIsSelecting(true)
    const outputPath = await window.api.selectFolder({
      defaultPath: form.getFieldValue('outputPath')
    })
    form.setFieldValue('outputPath', outputPath)
    setIsSelecting(false)
  }, [form, isSelecting])

  const onReset = useCallback(() => {
    setInputData(null)
    form.resetFields()
    window.path.get('output').then((res) => {
      form.setFieldValue('outputPath', res)
    })
  }, [form])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    (values) => {
      console.log(values)
      cutAudio(
        {
          ...values,
          startTime: values.audioRange[0],
          endTime: values.audioRange[1]
        },
        () => {
          navigate('/workspace')
        }
      )
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

        <Form.Item<FieldType> name="audioFormat" label="音频格式" initialValue="mp3">
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

        <Form.Item<FieldType> name="audioRange" label="截取范围" initialValue={[0, 100]}>
          <Slider
            step={0.001}
            min={0}
            max={Number(inputData?.duration) || 0}
            tooltip={{
              formatter: (value) => formatSeconds(value || 0)
            }}
            marks={{
              0: formatSeconds(0),
              ...(inputData?.duration && {
                [inputData.duration]: formatSeconds(Number(inputData.duration))
              })
            }}
            disabled={!inputData}
            range
          />
        </Form.Item>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Flex justify="center" align="center" gap={10}>
            <Button htmlType="button" onClick={onReset}>
              重置
            </Button>
            <Button type="primary" htmlType="submit">
              导出
            </Button>
          </Flex>
        </Form.Item>
      </Form>
      <Spin spinning={isLoading} fullscreen />
    </>
  )
}
