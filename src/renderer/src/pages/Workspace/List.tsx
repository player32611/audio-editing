import {
  App,
  Button,
  Flex,
  FloatButton,
  Space,
  Table,
  Tag,
  Typography,
  type TableProps
} from 'antd'
import {
  ExportOutlined,
  DeleteOutlined,
  EditOutlined,
  FontColorsOutlined,
  PlusOutlined,
  ScissorOutlined,
  TranslationOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { WorkHistoryUnion } from '../../../../shared/type'
import { getStatusColor } from '@renderer/utils'

interface ListData extends WorkHistoryUnion {
  progress?: number
}

const { Text } = Typography

export default function List(): ReactNode {
  const [data, setData] = useState<ListData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectIds, setSelectIds] = useState<number[]>([])
  const [pageSize, setPageSize] = useState<number>(Math.floor((window.innerHeight - 260) / 65))
  const { message, modal } = App.useApp()
  const navigate = useNavigate()

  const key = 'delete'

  const onRefresh = useCallback(async () => {
    return window.database.selectWorkHistoryUnion().then(async (res) => {
      const workList = await window.work.getAll()
      setData(
        res.map((item) => ({
          ...item,
          key: item.id,
          progress: workList.get(item.id)?.progress
        }))
      )
      setIsLoading(false)
    })
  }, [])

  const onChange = useCallback((selectedRowKeys: React.Key[]) => {
    setSelectIds(selectedRowKeys as number[])
  }, [])

  const onDelete = useCallback(
    async (ids: number[], title?: string, content?: ReactNode | string) => {
      const confirmed = await modal.confirm({
        title: title || '是否删除',
        content: content || '这将从列表删除任务，且无法恢复！'
      })
      if (!confirmed) return
      message.open({
        key,
        type: 'loading',
        content: '删除中'
      })
      window.database
        .deleteBatchByIds('work_history', ids)
        .then(() => {
          message.open({
            key,
            type: 'success',
            content: '删除成功',
            duration: 2
          })
          onRefresh()
        })
        .catch(() => {
          message.open({
            key,
            type: 'error',
            content: '删除失败',
            duration: 2
          })
        })
    },
    [message, modal, onRefresh]
  )

  const onResize = useCallback(() => {
    setPageSize(Math.floor((window.innerHeight - 260) / 65))
  }, [])

  const onNavigate = useCallback(() => {
    message.info('功能建设中')
  }, [message])

  useEffect(() => {
    onRefresh().then(() => {
      setTimeout(() => {
        onResize()
      }, 0)
    })

    const unsubscribe = window.work.onChanged((worklist) => {
      console.log(worklist)
      onRefresh()
    })
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      unsubscribe()
    }
  }, [onRefresh, onResize])

  const columns: TableProps<ListData>['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      key: 'typeName',
      render: (typeName) => <Text strong>{typeName}</Text>
    },
    {
      title: '状态',
      dataIndex: 'statusName',
      key: 'statusName',
      render: (statusName, record) => (
        <Tag color={getStatusColor(statusName)}>
          {statusName}
          {record.progress ? `${Math.floor(record.progress)}%` : ''}
        </Tag>
      )
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
      render: (path, record) => (
        <a
          onClick={() => {
            window.api.showItemInFolder(`${path}\\${record.name}`).catch(() => {
              onDelete([record.id], '文件不存在', '文件已被移动或删除，是否从列表中删除？')
            })
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
      <Space orientation="vertical">
        <Flex align="center" justify="space-between">
          <div>历史任务</div>
          <Button
            type="primary"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(selectIds)}
            disabled={!selectIds.length}
            danger
          >
            删除
          </Button>
        </Flex>

        <Table<ListData>
          columns={columns}
          loading={isLoading}
          dataSource={data}
          rowKey={(record) => record.id}
          column={{ align: 'center' }}
          rowSelection={{ type: 'checkbox', onChange }}
          locale={{ emptyText: null }}
          pagination={{
            total: data.length,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: false,
            placement: ['bottomCenter'],
            hideOnSinglePage: true,
            pageSize
          }}
        />
      </Space>

      <FloatButton.Group icon={<PlusOutlined />} type="primary" trigger="click">
        <FloatButton
          icon={<EditOutlined />}
          tooltip={{
            title: '音频编辑',
            color: 'blue',
            placement: 'left'
          }}
          onClick={() => navigate('/workspace/audioEdit')}
        />
        <FloatButton
          icon={<ExportOutlined />}
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
          onClick={() => navigate('/workspace/audioTrim')}
        />
        <FloatButton
          icon={<FontColorsOutlined />}
          tooltip={{
            title: '语音识别',
            color: 'blue',
            placement: 'left'
          }}
          onClick={() => navigate('/workspace/speechRecognition')}
        />
        <FloatButton
          icon={<TranslationOutlined />}
          tooltip={{
            title: '汉英转译',
            color: 'blue',
            placement: 'left'
          }}
          onClick={() => onNavigate()}
        />
      </FloatButton.Group>
    </>
  )
}
