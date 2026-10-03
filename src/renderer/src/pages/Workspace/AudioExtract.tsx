import { Button, Divider, Flex, Form, FormProps, Input, InputNumber, Radio } from 'antd'
import { FolderOpenOutlined, LeftOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { AudioFormat } from '../../../../shared/type'

interface FieldType {
  inputVideo: string
  outputPath: string
  outputName: string
  audioFormat: AudioFormat
  audioBitrate: number
}

export default function AudioExtract(): ReactNode {
  const [form] = Form.useForm<FieldType>()
  const [isSelecting, setIsSelecting] = useState<boolean>()
  const navigate = useNavigate()

  const onSelectInput = useCallback(async (): Promise<void> => {
    if (isSelecting) return
    setIsSelecting(true)
    const path = form.getFieldValue('inputVideo') || (await window.path.get('input')) || undefined
    window.api
      .selectFile({
        defaultPath: path,
        filters: [{ name: '视频', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'] }]
      })
      .then((res) => {
        if (!res) return
        form.setFieldValue('inputVideo', res)
        form.setFieldValue('outputName', res.split('\\').at(-1)?.split('.')[0])
      })
      .finally(() => setIsSelecting(false))
  }, [form, isSelecting])

  const onSelectOutput = useCallback((): void => {
    if (isSelecting) return
    setIsSelecting(true)
    window.api
      .selectFolder({ defaultPath: form.getFieldValue('outputPath') || undefined })
      .then((res) => {
        if (!res) return
        form.setFieldValue('outputPath', res)
      })
      .finally(() => setIsSelecting(false))
  }, [form, isSelecting])

  const onReset = useCallback((): void => {
    form.resetFields()
    window.path.get('output').then((res) => {
      form.setFieldValue('outputPath', res)
    })
  }, [form])

  const onFinish: FormProps<FieldType>['onFinish'] = useCallback(
    async (values) => {
      const typeId = await window.database.selectType('汉英转译')
      const statusId = await window.database.selectStatus('待处理')
      console.log(typeId, statusId)
      window.database
        .insertWorkHistory({
          name: `${values.outputName}.${values.audioFormat}`,
          time: new Date().toISOString(),
          path: values.outputPath,
          typeId,
          statusId
        })
        .then((res) => console.log(res))
      window.sellmind
        .getVoice({
          inputVideo: values.inputVideo,
          outputAudio: `${values.outputPath}\\${values.outputName}.${values.audioFormat}`,
          audioFormat: values.audioFormat,
          audioBitrate: `${values.audioBitrate}k`
        })
        .then((res) => console.log(res))
        .catch((err) => console.log(err))
      navigate('/workspace')
    },
    [navigate]
  )

  useEffect(() => {
    onReset()
  }, [onReset])

  return (
    <>
      <Button
        color="default"
        variant="text"
        icon={<LeftOutlined />}
        onClick={() => navigate('/workspace')}
      >
        返回
      </Button>
      <Divider />
      <Form
        name="config"
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
      >
        <Form.Item<FieldType>
          name="inputVideo"
          label="输入文件"
          rules={[{ required: true, message: '请选择输入文件' }]}
        >
          <Input suffix={<FolderOpenOutlined />} onClick={onSelectInput} />
        </Form.Item>

        <Form.Item<FieldType>
          name="outputPath"
          label="输出路径"
          rules={[{ required: true, message: '请选择输出目录' }]}
        >
          <Input suffix={<FolderOpenOutlined />} onClick={onSelectOutput} />
        </Form.Item>

        <Form.Item<FieldType>
          name="outputName"
          label="输出文件名"
          rules={[{ required: true, message: '请设置输出文件名' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType> name="audioFormat" label="音频格式" initialValue="mp3">
          <Radio.Group>
            <Radio.Button value="mp3">mp3</Radio.Button>
            <Radio.Button value="wav">wav</Radio.Button>
            <Radio.Button value="aac">acc</Radio.Button>
            <Radio.Button value="flac">flac</Radio.Button>
            <Radio.Button value="ogg">ogg</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item<FieldType> name="audioBitrate" label="音频码率" initialValue="192">
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
