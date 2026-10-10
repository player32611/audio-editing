import {
  Row,
  Col,
  Button,
  Divider,
  Flex,
  Input,
  Typography,
  Spin,
  Form,
  Image,
  FloatButton,
  type FormProps
} from 'antd'
import { FolderOpenOutlined, LeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useCallback, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AUDIO_FILE_EXTENSION, IMAGE_FILE_EXTENSION } from '../../../../shared/constants'
import type { AudioTag } from '../../../../shared/type'
import { useTools } from '@renderer/hooks'

interface FieldType extends AudioTag {
  inputAudio: string
  outputPath: string
  outputName: string
  coverPath: string
}

const { Text } = Typography

export function AudioEdit(): ReactNode {
  const [form] = Form.useForm<FieldType>()
  const [coverSrc, setCoverSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const disabled = !form.getFieldValue('inputAudio')
  const navigate = useNavigate()
  const { setAudioTags } = useTools()

  const onReset = useCallback(async () => {
    setIsLoading(true)
    form.resetFields()
    setCoverSrc(null)
    const defaultPath = await window.path.get('output')
    form.setFieldValue('outputPath', defaultPath)
    setIsLoading(false)
  }, [form])

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
    const data = await window.ffmpeg.getMediaData(inputPath)
    console.log(data)
    onReset()
    form.setFieldsValue({ inputAudio: inputPath, outputName: inputName.name, ...data.format.tags })
    setIsLoading(false)

    window.ffmpeg.getAudioCover(inputPath).then((res) => {
      if (!res.length) return
      const blob = new Blob([res], {
        type: 'image/jpeg'
      })
      setCoverSrc(URL.createObjectURL(blob))
    })
  }, [form, isSelecting, onReset])

  const onSelectOutput = useCallback(async (): Promise<void> => {
    if (isSelecting || disabled) return

    setIsSelecting(true)
    const outputPath = await window.api.selectFolder({
      defaultPath: form.getFieldValue('outputPath') || undefined
    })
    form.setFieldValue('outputPath', outputPath)
    setIsSelecting(false)
  }, [form, isSelecting, disabled])

  const onSelectCover = useCallback(async () => {
    if (isSelecting || disabled) return

    setIsSelecting(true)
    const coverPath = await window.api.selectFile({
      defaultPath: form.getFieldValue('coverPath') || undefined,
      filters: [{ name: '图片', extensions: Object.values(IMAGE_FILE_EXTENSION) }]
    })
    if (coverPath) {
      const imageSrc = await window.api.loadImage(coverPath)
      form.setFieldValue('coverPath', coverPath)
      setCoverSrc(imageSrc.dataUrl)
    }
    setIsSelecting(false)
  }, [form, isSelecting, disabled])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    async ({ inputAudio, outputPath, outputName, ...tags }) => {
      setIsLoading(true)
      const { ext } = await window.api.parseFilePath(inputAudio)
      setAudioTags({
        inputAudio,
        outputAudio: `${outputPath}\\${outputName}.${ext}`,
        ...tags
      })
        .then(() => {
          navigate('/workspace')
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [navigate, setAudioTags]
  )

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
          <Text strong>音频编辑</Text>
        </Col>
      </Row>

      <Divider />

      <Spin spinning={isLoading} fullscreen />

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
            disabled={disabled}
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
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType>
          name="coverPath"
          label="封面"
          tooltip="由于限制，"
        >
          <Input
            suffix={<FolderOpenOutlined onClick={onSelectCover} />}
            onClick={onSelectCover}
            disabled={disabled}
          />
        </Form.Item>

        {coverSrc ? (
          <Form.Item label="封面预览">
            <Image src={coverSrc} width={100} />
          </Form.Item>
        ) : null}

        <Form.Item<FieldType> name="title" label="标题">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="artist" label="参与创作的艺术家">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="album_artist" label="唱片集艺术家">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="album" label="唱片集">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="composer" label="作曲家">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="genre" label="流派">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="date" label="年份">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="track" label="曲目编号">
          <Input disabled={disabled} />
        </Form.Item>

        <Form.Item<FieldType> name="disc" label="唱片编号">
          <Input disabled={disabled} />
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
          title:
            '由于限制，wav 等部分音频格式不支持在文件管理器中显示标题、作者等信息，建议使用 mp3 或 flac 格式'
        }}
      />
    </>
  )
}
