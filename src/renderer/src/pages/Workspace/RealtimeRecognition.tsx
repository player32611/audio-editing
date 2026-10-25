import {
  Row,
  Col,
  Button,
  Typography,
  Divider,
  FloatButton,
  Spin,
  Form,
  type FormProps,
  Space,
  Input,
  Radio,
  Flex,
  Card
} from 'antd'
import { LeftOutlined, FolderOpenOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Language, WhisperModelType } from '../../../../shared/type'
import { LANGUAGE, WHISPER_MODEL_TYPE } from '../../../../shared/constants'
import { formatLanguage } from '@renderer/utils'
import { useTools } from '@renderer/hooks'
import { RealtimeWave } from '@renderer/components/common/RealtimeWave'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text } = Typography

interface FieldType {
  recognizeContent: string
  outputPath: string
  outputName: string
  language: Language
  model: WhisperModelType
}

export default function RealtimeRecognition(): ReactNode {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [form] = Form.useForm<FieldType>()

  const navigate = useNavigate()
  const { startRecognize, stopRecognize, saveContent } = useTools()

  const onSelectOutput = useCallback(async () => {
    if (isSelecting) return

    setIsSelecting(true)
    const outputPath = await window.api.selectFolder({
      defaultPath: form.getFieldValue('outputPath') || undefined
    })
    if (outputPath) form.setFieldValue('outputPath', outputPath)
    setIsSelecting(false)
  }, [isSelecting, form])

  const onReset = useCallback(async () => {
    setIsLoading(true)
    setIsRecording(false)
    form.resetFields()
    form.setFieldValue('outputPath', await window.path.get('output'))
    setIsLoading(false)
  }, [form])

  const onRecognize = useCallback(async () => {
    setIsLoading(true)
    if (!isRecording) {
      await startRecognize({
        model: form.getFieldValue('model'),
        language: form.getFieldValue('language'),
        onRecognize: (text) => {
          const cur = form.getFieldValue('recognizeContent')
          form.setFieldValue('recognizeContent', cur + '\n' + text)
        }
      })
        .then(() => {
          setIsRecording(true)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      await stopRecognize()
        .then(() => {
          setIsRecording(false)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isRecording, startRecognize, stopRecognize, form])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    async (params) => {
      setIsLoading(true)
      const filePath = await window.api.joinPath(params.outputPath, `${params.outputName}.txt`)
      await saveContent({ outputFile: filePath, content: params.recognizeContent })
        .then(() => {
          navigate('/workspace')
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [navigate, saveContent]
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
          <Text strong>实时识别</Text>
        </Col>
      </Row>

      <Divider />

      <Form
        name="speechRecognition"
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
      >
        <Form.Item label={null}>
          <Card styles={{ body: { padding: 0 } }}>
            <RealtimeWave isRecording={isRecording} />
          </Card>
        </Form.Item>

        <Form.Item<FieldType> label="识别内容" name="recognizeContent">
          <TextArea
            autoSize={{
              minRows: 1,
              maxRows: 5
            }}
            style={{ resize: 'none' }}
            allowClear
            readOnly
          />
        </Form.Item>

        <Form.Item<FieldType> label="输出路径" required>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item
              name="outputPath"
              rules={[{ required: true, message: '请选择输出目录' }]}
              style={{ width: '100%', marginBottom: 0 }}
            >
              <Input />
            </Form.Item>
            <Button icon={<FolderOpenOutlined />} onClick={onSelectOutput}></Button>
          </Space.Compact>
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
          initialValue={dayjs().format('YYYY-MM-DD HH-mm-ss')}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType> name="language" label="语言" initialValue="auto">
          <Radio.Group disabled={isRecording}>
            {Object.values(LANGUAGE).map((val) => (
              <Radio.Button value={val} key={val}>
                {formatLanguage(val)}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item<FieldType> name="model" label="识别模型" initialValue="medium">
          <Radio.Group disabled={isRecording}>
            {Object.values(WHISPER_MODEL_TYPE).map((val) => (
              <Radio.Button value={val} key={val}>
                {val}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Flex justify="center" align="center" gap={10}>
            <Button htmlType="button" onClick={onReset} disabled={isRecording}>
              重置
            </Button>
            <Button type="primary" htmlType="button" onClick={onRecognize}>
              {isRecording ? '暂停识别' : '开始识别'}
            </Button>
            <Button type="primary" htmlType="submit" disabled={isRecording}>
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
