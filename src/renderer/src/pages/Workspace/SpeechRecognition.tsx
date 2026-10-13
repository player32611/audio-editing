import {
  Row,
  Col,
  Button,
  Typography,
  Divider,
  Form,
  Input,
  Flex,
  Spin,
  Radio,
  FloatButton,
  type FormProps,
  Switch
} from 'antd'
import { LeftOutlined, FolderOpenOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  AUDIO_FILE_EXTENSION,
  LANGUAGE,
  WHISPER_MODEL_OUTPUT_EXTENSION,
  WHISPER_MODEL_TYPE
} from '../../../../shared/constants'
import { formatLanguage } from '@renderer/utils'
import type { Language, WhisperModel, WhisperModelOutputExtension } from '../../../../shared/type'
import { useTools } from '@renderer/hooks'

interface FieldType {
  inputAudio: string
  outputPath: string
  outputName: string
  outputExtension: WhisperModelOutputExtension
  language: Language
  model: WhisperModel
  prompt: string
  translate: boolean
}

const { Text } = Typography

export default function SpeechRecognition(): ReactNode {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { speechRecognize } = useTools()

  const onReset = useCallback(async () => {
    setIsLoading(true)
    form.resetFields()
    const outputPath = await window.path.get('output')
    form.setFieldValue('outputPath', outputPath)
    setIsLoading(false)
  }, [form])

  const onSelectInput = useCallback(async () => {
    if (isSelecting) return

    setIsSelecting(true)
    const defaultInput = form.getFieldValue('inputAudio') || (await window.path.get('input'))
    const inputPath = await window.api.selectFile({
      defaultPath: defaultInput,
      filters: [{ name: '音频', extensions: Object.values(AUDIO_FILE_EXTENSION) }]
    })
    setIsSelecting(false)
    if (!inputPath) return

    await onReset()
    setIsLoading(true)
    const inputName = await window.api.parseFilePath(inputPath)
    form.setFieldsValue({
      inputAudio: inputPath,
      outputName: inputName.name
    })
    setIsLoading(false)
  }, [isSelecting, form, onReset])

  const onSelectOutput = useCallback(async () => {
    if (isSelecting) return

    setIsSelecting(true)
    const outputPath = await window.api.selectFolder({
      defaultPath: form.getFieldValue('outputPath') || undefined
    })
    if (outputPath) form.setFieldValue('outputPath', outputPath)
    setIsSelecting(false)
  }, [isSelecting, form])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    async ({ outputPath, outputName, ...params }: FieldType) => {
      setIsLoading(true)
      speechRecognize({
        outputFileWithoutExt: `${outputPath}\\${outputName}`,
        ...params
      })
        .then(() => {
          navigate('/workspace')
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [navigate, speechRecognize]
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
          <Text strong>语音识别</Text>
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

        <Form.Item<FieldType> name="language" label="语言" initialValue="auto">
          <Radio.Group>
            {Object.values(LANGUAGE).map((val) => (
              <Radio.Button value={val} key={val}>
                {formatLanguage(val)}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item<FieldType> name="model" label="识别模型" initialValue="medium">
          <Radio.Group>
            {Object.values(WHISPER_MODEL_TYPE).map((val) => (
              <Radio.Button value={val} key={val}>
                {val}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item<FieldType> name="outputExtension" label="输出格式" initialValue="json">
          <Radio.Group>
            {Object.values(WHISPER_MODEL_OUTPUT_EXTENSION).map((val) => (
              <Radio.Button value={val} key={val}>
                {val}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item<FieldType>
          name="prompt"
          label="提示词"
          tooltip="提供初始文本提示，更容易识别准确"
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType> name="translate" label="翻译为英文" initialValue={false}>
          <Switch />
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

      <FloatButton
        icon={<ExclamationCircleOutlined />}
        tooltip={{
          title: '识别结果仅供参考，请以实际为准',
          placement: 'left'
        }}
      />

      <Spin spinning={isLoading} fullscreen />
    </>
  )
}
