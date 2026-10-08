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
 * 将秒数格式化为 HH:MM:SS.mmm 格式
 * @param seconds 秒数
 * @param options 配置项
 * @param options.showMs 是否显示毫秒，默认 true
 * @param options.msDigits 毫秒保留位数（1-3），默认 3
 * @returns 格式化后的时间字符串
 */
export const formatSeconds = (
  seconds: number,
  options: { showMs?: boolean; msDigits?: 1 | 2 | 3 } = {}
): string => {
  const { showMs = true, msDigits = 3 } = options

  if (seconds < 0 || !Number.isFinite(seconds)) {
    throw new Error('Invalid seconds value')
  }

  const totalMs = Math.round(seconds * 1000)
  const h = Math.floor(totalMs / 3_600_000)
  const m = Math.floor((totalMs % 3_600_000) / 60_000)
  const s = Math.floor((totalMs % 60_000) / 1000)
  const ms = totalMs % 1000

  const pad = (n: number, len = 2): string => n.toString().padStart(len, '0')

  const msPart = showMs ? `.${pad(ms, 3).slice(0, msDigits)}` : ''
  const timePart = `${pad(m)}:${pad(s)}${msPart}`

  return h > 0 ? `${pad(h)}:${timePart}` : timePart
}
