import { ipcMain } from 'electron'
import { sendMessage } from '.'
import { selectWorkHistoryById } from './database'
import { deleteFile } from './api'
import path from 'path'
import type { WorkListItem } from '../shared/type'

/** 可被中断的运行实例：FFmpeg 命令或子进程，二者都提供 kill() */
interface Killable {
  kill(signal?: string | number): unknown
}

const workList = new Map<number, WorkListItem>()
const instanceList = new Map<number, Killable>()

export const setWorkList = (id: number, { status, progress }: WorkListItem): void => {
  const data = workList.get(id)
  workList.set(id, {
    status: status || data?.status || '待处理',
    progress: progress || data?.progress || 0
  })
  sendMessage('work:changed', workList)
}

export const getWorkList = (id: number): WorkListItem | null => {
  const res = workList.get(id)
  if (res) return res
  return null
}

export const getAllWorkList = (): Map<number, WorkListItem> => {
  return workList
}

export const completeWorkList = (id: number): void => {
  workList.delete(id)
  instanceList.delete(id)
  sendMessage('work:changed', workList)
}

export const deleteWorkList = (id: number): void => {
  const data = selectWorkHistoryById(id)
  if (!data) return

  instanceList.get(id)?.kill('SIGKILL')
  workList.delete(id)
  instanceList.delete(id)
  deleteFile(path.join(data.path, data.name))
  sendMessage('work:changed', workList)
}

export const deleteBatchWorkList = (ids: number[]): void => {
  ids.forEach((id) => {
    const data = selectWorkHistoryById(id)
    if (!data) return

    instanceList.get(id)?.kill('SIGKILL')
    workList.delete(id)
    instanceList.delete(id)
    deleteFile(path.join(data.path, data.name))
  })
  sendMessage('work:changed', workList)
}

export const setInstanceList = (id: number, instance: Killable): void => {
  instanceList.set(id, instance)
}

export const getInstanceList = (id: number): Killable | null => {
  return instanceList.get(id) || null
}

ipcMain.handle('work:set', (_, id: number, { status, progress }: WorkListItem): void => {
  setWorkList(id, { status, progress })
})

ipcMain.handle('work:get', (_, id: number): WorkListItem | null => {
  return getWorkList(id)
})

ipcMain.handle('work:getAll', (): Map<number, WorkListItem> => {
  return getAllWorkList()
})

ipcMain.handle('work:complete', (_, id: number) => {
  completeWorkList(id)
})

ipcMain.handle('work:delete', (_, id: number) => {
  deleteWorkList(id)
})

ipcMain.handle('work:deleteBatch', (_, ids: number[]) => {
  deleteBatchWorkList(ids)
})
