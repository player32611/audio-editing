import {
  Button,
  Flex,
  FloatButton,
  Modal,
  message,
  Space,
  Typography,
  Table,
  Tag,
  type TableProps
} from 'antd'
import {
  AudioOutlined,
  DeleteOutlined,
  PlusOutlined,
  ScissorOutlined,
  TranslationOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { WorkHistoryUnion } from '../../../../shared/type'
import { getStatusColor } from '@renderer/utils'

const { Paragraph } = Typography

interface DataType extends WorkHistoryUnion {
  key: number
}

export default function List(): ReactNode {
  const [data, setData] = useState<DataType[]>([])
  const [selectIds, setSelectIds] = useState<number[]>([])
  const [messageApi, messageContext] = message.useMessage()
  const [modal, modalContext] = Modal.useModal()
  const navigate = useNavigate()

  const key = 'delete'

  const onRefresh = useCallback(() => {
    window.database.selectWorkHistory().then((res) => {
      setData(res.map((item) => ({ ...item, key: item.id })))
    })
  }, [])

  const onChange = useCallback((selectedRowKeys: React.Key[]) => {
    setSelectIds(selectedRowKeys as number[])
  }, [])

  const onDelete = useCallback(
    async (ids: number[]) => {
      const confirmed = await modal.confirm({
        title: '是否删除',
        content: <Paragraph>这将从列表删除任务，且无法恢复！</Paragraph>
      })
      if (!confirmed) return
      messageApi.open({
        key,
        type: 'loading',
        content: '删除中'
      })
      window.database
        .deleteBatchByIds('work_history', ids)
        .then(() => {
          messageApi.open({
            key,
            type: 'success',
            content: '删除成功',
            duration: 2
          })
          onRefresh()
        })
        .catch(() => {
          messageApi.open({
            key,
            type: 'error',
            content: '删除失败',
            duration: 2
          })
        })
    },
    [messageApi, modal, onRefresh]
  )

  useEffect(() => {
    onRefresh()

    const unsubscribe = window.work.onChanged(() => {
      onRefresh()
    })

    return unsubscribe
  }, [onRefresh])

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      key: 'typeName'
    },
    {
      title: '状态',
      dataIndex: 'statusName',
      key: 'statusName',
      render: (statusName) => <Tag color={getStatusColor(statusName)}>{statusName}</Tag>
    },
    {
      title: '时间',
      key: 'time',
      dataIndex: 'time',
      width: 200,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '位置',
      key: 'path',
      dataIndex: 'path',
      ellipsis: true,
      render: (path) => (
        <a
          onClick={() => {
            window.api.openFolder(path)
          }}
        >
          {path}
        </a>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button color="danger" variant="link" onClick={() => onDelete([record.id])}>
          删除
        </Button>
      )
    }
  ]

  return (
    <>
      {messageContext}
      <Space orientation="vertical">
        <Flex justify="flex-end">
          <Button
            type="primary"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(selectIds)}
            danger
          >
            删除
          </Button>
        </Flex>

        <Table<DataType>
          column={{ align: 'center' }}
          rowSelection={{ type: 'checkbox', onChange }}
          columns={columns}
          dataSource={data}
        />
      </Space>

      <FloatButton.Group icon={<PlusOutlined />} type="primary" trigger="click">
        <FloatButton
          icon={<AudioOutlined />}
          tooltip={{
            title: '音频提取',
            color: 'blue',
            placement: 'left'
          }}
          onClick={() => navigate('/workspace/extract')}
        />
        <FloatButton
          icon={<ScissorOutlined />}
          tooltip={{
            title: '音频裁剪',
            color: 'blue',
            placement: 'left'
          }}
        />
        <FloatButton
          icon={<TranslationOutlined />}
          tooltip={{
            title: '汉英转译',
            color: 'blue',
            placement: 'left'
          }}
        />
      </FloatButton.Group>
      {modalContext}
    </>
  )
}
