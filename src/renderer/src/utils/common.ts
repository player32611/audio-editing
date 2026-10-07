import { WorkStatus } from '../../../shared/type'

export const getStatusColor = (status: WorkStatus): string => {
  switch (status) {
    case '处理中':
      return 'rgb(22, 119, 255)'
    case '已中断':
      return 'rgb(0, 0, 0)'
    case '已完成':
      return 'rgb(82, 196, 26)'
    case '待处理':
      return 'rgb(250, 173, 20)'
  }
}

/**
 * 将秒数格式化为 HH:MM:SS 格式
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
export const formatSeconds = (seconds: number): string => {
  if (seconds < 0 || !Number.isFinite(seconds)) {
    throw new Error('Invalid seconds value')
  }

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const pad = (n: number): string => n.toString().padStart(2, '0')

  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
