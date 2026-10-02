import {
  Button,
  Divider,
  Flex,
  Form,
  FormProps,
  Input,
  InputNumber,
  Radio,
  Typography,
  Upload,
  message
} from 'antd'
import { FolderOpenOutlined, LeftOutlined, InboxOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { UploadProps } from 'antd/lib/upload'
import { getVoice } from '@sellmind/video-editor-core'
import { RcFile } from 'antd/es/upload'

interface FieldType {
  outputPath: string
  format: string
  bitrate: number
}

const { Text } = Typography
const { Dragger } = Upload

export default function AudioExtract(): ReactNode {
  const [fileList, setFileList] = useState<RcFile[]>([])
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm<FieldType>()
  const navigate = useNavigate()

  const props: UploadProps = {
    name: 'file',
    accept: '.mp4,.avi,.mov,.mkv,.webm,.flv',
    style: {
      width: '100%'
    },
    beforeUpload: (_, fileList) => {
      setFileList(fileList)
      messageApi.success('上传成功')
      return false
    }
  }

  const onReset = useCallback((): void => {
    form.resetFields()
    window.path.get('output').then((res) => {
      form.setFieldValue('outputPath', res)
    })
  }, [form])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    (values) => {
      console.log('Success:', values)
      console.log(fileList)
      // splitVoiceAndVideo({
      //   inputVideo:
      // }).then()
    },
    [fileList]
  )

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = useCallback((errorInfo) => {
    console.log('Failed:', errorInfo)
  }, [])

  useEffect(() => {
    onReset()
  }, [onReset])

  return (
    <>
      {contextHolder}
      <Button
        color="default"
        variant="text"
        icon={<LeftOutlined />}
        onClick={() => navigate('/workspace')}
      >
        返回
      </Button>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <Text strong>点击或拖拽以上传文件</Text>
      </Dragger>
      <Divider />
      <Form
        name="config"
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item<FieldType> name="outputPath" label="输出路径">
          <Input suffix={<FolderOpenOutlined />} />
        </Form.Item>

        <Form.Item<FieldType> name="format" label="音频格式" initialValue="mp3">
          <Radio.Group>
            <Radio.Button value="mp3">mp3</Radio.Button>
            <Radio.Button value="wav">wav</Radio.Button>
            <Radio.Button value="aac">AAC</Radio.Button>
            <Radio.Button value="flac">flac</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item<FieldType> name="bitrate" label="音频码率" initialValue="192">
          <InputNumber suffix="k" changeOnWheel />
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
    </>
  )
}
