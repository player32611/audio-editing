import { Language, WorkStatus } from '../../../shared/type'

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

export const formatLanguage = (language: Language): string => {
  switch (language) {
    case 'zh':
      return '中文'
    case 'yue':
      return '粤语'
    case 'en':
      return '英语'
    case 'ja':
      return '日语'
    case 'fr':
      return '法语'
    case 'auto':
      return '自动识别'
    default:
      return language
  }
}

/**
 * 防抖函数：在最后一次调用后的 delay 毫秒执行。
 */
export const debounce = <Args extends unknown[]>(
  func: (...args: Args) => void,
  delay: number
): ((...args: Args) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Args): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }
}
/**
 * 节流函数：首次立即执行，后续调用最多每隔 delay 毫秒执行一次，
 * 并在等待期间保留最后一次调用。
 */
export const throttle = <Args extends unknown[]>(
  func: (...args: Args) => void,
  delay: number
): ((...args: Args) => void) => {
  let lastExecTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Args): void => {
    const currentTime = Date.now()

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (currentTime - lastExecTime >= delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      timeoutId = setTimeout(
        () => {
          func(...args)
          lastExecTime = Date.now()
          timeoutId = null
        },
        delay - (currentTime - lastExecTime)
      )
    }
  }
}
