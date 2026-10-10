import { App } from 'antd'
import { useCallback } from 'react'
import type { AudioFileExtension, AudioTag } from '../../../shared/type'

interface useToolsData {
  getVoice: (params: getVoiceParams) => Promise<void>
  cutAudio: (params: CutAudioParams) => Promise<void>
  setAudioTags: (params: SetAudioTagsParams) => Promise<void>
}

interface getVoiceParams {
  inputVideo: string
  outputAudio: string
  audioFormat: AudioFileExtension
  audioBitrate: string
  audioQuality: number
  startTime: number
  duration: number
}

interface CutAudioParams {
  inputAudio: string
  outputAudio: string
  audioFormat: AudioFileExtension
  audioBitrate: string
  audioQuality: number
  startTime: number
  duration: number
}

interface SetAudioTagsParams extends AudioTag {
  inputAudio: string
  outputAudio: string
  coverPath: string
}

export function useTools(): useToolsData {
  const { message, notification } = App.useApp()
  const key = 'message'

  const checkPath = useCallback(
    async (inputFile: string, outputFile: string, coverFile?: string): Promise<boolean> => {
      const openMessage = (msg: string): void => {
        message.open({
          key,
          type: 'error',
          content: msg,
          duration: 3
        })
      }

      const isExistInput = await window.api.existsSync(inputFile)
      if (!isExistInput) {
        openMessage('输入文件不存在，请重试')
        return false
      }

      const isExistOutputFile = await window.api.existsSync(outputFile)
      if (isExistOutputFile) {
        openMessage('已存在同名文件，请重试')
        return false
      }

      const outputInfo = await window.api.parseFilePath(outputFile)
      const isExistOutputPath = await window.api.existsSync(outputInfo.dir)
      if (!isExistOutputPath) {
        openMessage('输出文件夹不存在，请重试')
        return false
      }

      if (coverFile) {
        const isExistOuput = await window.api.existsSync(coverFile)
        if (!isExistOuput) {
          openMessage('封面图片不存在，请重试')
          return false
        }
      }

      return true
    },
    [message]
  )

  const onBegin = useCallback(
    async (id: number) => {
      await window.work.set(id, '处理中')
      message.open({
        key,
        type: 'success',
        content: '已开始处理',
        duration: 3
      })
    },
    [message]
  )

  const onSuccess = useCallback(
    async (id: number, filename: string) => {
      const finishStatus = await window.database.selectStatus('已完成')
      await window.database.updateWorkHistory(id, { statusId: finishStatus })
      await window.work.delete(id)
      notification.success({
        title: '任务完成',
        description: `您的 ${filename} 已处理完成，请查看`,
        showProgress: true,
        duration: 3
      })
    },
    [notification]
  )

  const onError = useCallback(
    async (id: number, msg?: string) => {
      const failedId = await window.database.selectStatus('已中断')
      window.database.updateWorkHistory(id, { statusId: failedId })
      window.work.delete(id)
      message.open({
        key,
        type: 'error',
        content: msg ? `发生错误: ${msg}` : '发生未知错误，请重试',
        duration: 3
      })
    },
    [message]
  )

  const getVoice = useCallback(
    async (params: getVoiceParams) => {
      const checked = await checkPath(params.inputVideo, params.outputAudio)
      if (!checked) return

      const outputInfo = await window.api.parseFilePath(params.outputAudio)
      const type = await window.database.selectType('音频提取')
      const workStatus = await window.database.selectStatus('处理中')
      const id = await window.database.insertWorkHistory({
        name: outputInfo.fullName,
        time: new Date().toISOString(),
        path: outputInfo.dir,
        typeId: type,
        statusId: workStatus
      })

      window.sellmind
        .getVoice(params)
        .then(() => {
          onSuccess(id, outputInfo.fullName)
        })
        .catch((msg) => {
          console.log(msg)
          onError(id, msg)
        })
      await onBegin(id)
    },
    [checkPath, onBegin, onSuccess, onError]
  )

  const cutAudio = useCallback(
    async (params: CutAudioParams) => {
      const checked = await checkPath(params.inputAudio, params.outputAudio)
      if (!checked) return

      const outputInfo = await window.api.parseFilePath(params.outputAudio)
      const type = await window.database.selectType('音频裁剪')
      const workStatus = await window.database.selectStatus('处理中')
      const id = await window.database.insertWorkHistory({
        name: outputInfo.fullName,
        time: new Date().toISOString(),
        path: outputInfo.dir,
        typeId: type,
        statusId: workStatus
      })

      console.log(params)

      window.ffmpeg
        .cutAudio(params)
        .then(() => {
          onSuccess(id, outputInfo.fullName)
        })
        .catch((msg) => {
          console.log(msg)
          onError(id, msg)
        })

      await onBegin(id)
    },
    [checkPath, onBegin, onSuccess, onError]
  )

  const setAudioTags = useCallback(
    async (params: SetAudioTagsParams) => {
      const checked = await checkPath(params.inputAudio, params.outputAudio, params.coverPath)
      if (!checked) throw new Error()

      const outputInfo = await window.api.parseFilePath(params.outputAudio)
      const type = await window.database.selectType('音频编辑')
      const workStatus = await window.database.selectStatus('处理中')
      const id = await window.database.insertWorkHistory({
        name: outputInfo.fullName,
        time: new Date().toISOString(),
        path: outputInfo.dir,
        typeId: type,
        statusId: workStatus
      })

      window.ffmpeg
        .setAudioTags(params)
        .then(() => {
          onSuccess(id, outputInfo.fullName)
        })
        .catch((err) => {
          console.log(err)
          onError(id, err)
        })

      await onBegin(id)
    },
    [checkPath, onBegin, onSuccess, onError]
  )

  return { getVoice, cutAudio, setAudioTags }
}
