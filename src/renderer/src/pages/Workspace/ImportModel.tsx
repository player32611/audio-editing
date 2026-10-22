import { type ReactNode, useCallback, useState } from 'react'
import {
  Row,
  Col,
  Button,
  Divider,
  Typography,
  Form,
  Input,
  Flex,
  Radio,
  FloatButton,
  Spin,
  type FormProps,
  Space
} from 'antd'
import { LeftOutlined, FolderOpenOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import {
  WHISPER_MODEL_EXTENSION,
  WHISPER_MODEL_NAME,
  WHISPER_MODEL_TYPE
} from '../../../../shared/constants'
import { WHISPER_MODEL_DOWNLOAD_URL } from '@renderer/utils'
import { useTools } from '@renderer/hooks'
import type { WhisperModelType } from '../../../../shared/type'

interface FieldType {
  inputFile: string
  modelType: WhisperModelType
}

const { Text, Link } = Typography

export default function ImportModel(): ReactNode {
  const [form] = Form.useForm<FieldType>()
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  const { importModel } = useTools()

  const onSelectInput = useCallback(async (): Promise<void> => {
    if (isSelecting) return

    setIsSelecting(true)
    const defaultInput = form.getFieldValue('inputFile') || (await window.path.get('input'))
    const inputPath = await window.api.selectFile({
      defaultPath: defaultInput,
      filters: [{ name: '模型文件', extensions: Object.values(WHISPER_MODEL_EXTENSION) }]
    })
    setIsSelecting(false)
    if (!inputPath) return

    setIsLoading(true)
    form.setFieldValue('inputFile', inputPath)
    const info = await window.api.parseFilePath(inputPath)
    const isInclude = Object.entries(WHISPER_MODEL_NAME).find(([, v]) => v == info.fullName)
    if (isInclude) form.setFieldValue('modelType', isInclude[0])
    setIsLoading(false)
  }, [form, isSelecting])

  const onReset = useCallback(() => {
    form.resetFields()
  }, [form])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    async (params) => {
      setIsLoading(true)
      importModel(params)
        .then(() => {
          navigate('/workspace')
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [navigate, importModel]
  )

  const onOpenUrl = useCallback(() => {
    window.api.openExternal(WHISPER_MODEL_DOWNLOAD_URL)
  }, [])

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
          <Text strong>导入模型</Text>
        </Col>
      </Row>

      <Divider />

      <Form
        name="importModel"
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
      >
        <Form.Item<FieldType> label="输入文件">
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item<FieldType>
              name="inputFile"
              rules={[{ required: true, message: '请选择输入文件' }]}
              style={{ width: '100%', marginBottom: 0 }}
            >
              <Input />
            </Form.Item>
            <Button icon={<FolderOpenOutlined />} onClick={onSelectInput}></Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item<FieldType>
          name="modelType"
          label="模型类型"
          rules={[{ required: true, message: '请选择模型类型' }]}
        >
          <Radio.Group>
            {Object.values(WHISPER_MODEL_TYPE).map((val) => (
              <Radio.Button value={val} key={val}>
                {val}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Flex justify="center" align="center" gap={10}>
            <Button htmlType="button" onClick={onReset}>
              重置
            </Button>
            <Button htmlType="submit" type="primary">
              导入
            </Button>
          </Flex>
        </Form.Item>
      </Form>

      <FloatButton
        icon={<ExclamationCircleOutlined />}
        tooltip={{
          title: () => (
            <div>
              模型可从以下网址下载:
              <Link onClick={onOpenUrl} style={{ color: '#ffffff' }}>
                {WHISPER_MODEL_DOWNLOAD_URL}
              </Link>
            </div>
          ),
          color: 'blue',
          placement: 'left'
        }}
      />

      <Spin spinning={isLoading} fullscreen />
    </>
  )
}
