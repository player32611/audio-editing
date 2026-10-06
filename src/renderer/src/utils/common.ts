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
