import { ipcMain } from 'electron'
import { sendMessage } from '.'
import type { WorkListItem, WorkStatus } from '../shared/type'

const workList = new Map<number, { status: WorkStatus; progress: number }>()

export const setWorkList = (id: number, { status, progress }: WorkListItem): void => {
  const data = workList.get(id)
  workList.set(id, {
    status: status || data?.status || '待处理',
    progress: progress || data?.progress || 0
  })
  sendMessage('work:changed', workList)
}

export const getAllWorkList = (): Map<number, { status: WorkStatus; progress: number }> => {
  return workList
}

ipcMain.handle('work:set', (_, id: number, { status, progress }: WorkListItem): void => {
  setWorkList(id, { status, progress })
})

ipcMain.handle('work:get', (_, id: number): { status: WorkStatus; progress: number } | null => {
  const res = workList.get(id)
  if (res) return res
  return null
})

ipcMain.handle('work:getAll', (): Map<number, { status: WorkStatus; progress: number }> => {
  return getAllWorkList()
})

ipcMain.handle('work:delete', (_, id: number) => {
  workList.delete(id)
  sendMessage('work:changed', workList)
})
