import { App } from 'antd'
import { useCallback } from 'react'
import type { AudioFileExtension, AudioTag } from '../../../shared/type'

interface useFfmpegData {
  cutAudio: (params: CutAudioParams, onStart?: () => void, onFinish?: () => void) => Promise<void>
  setAudioTags: (
    params: SetAudioTagsParams,
    onStart?: () => void,
    onFinish?: () => void
  ) => Promise<void>
}

interface CutAudioParams {
  inputAudio: string
  outputPath: string
  outputName: string
  audioFormat: AudioFileExtension
  audioBitrate: number
  audioQuality: number
  startTime: number
  endTime: number
}

interface SetAudioTagsParams extends AudioTag {
  inputAudio: string
  outputPath: string
  outputName: string
  coverPath: string
}

export function useFfmpeg(): useFfmpegData {
  const { message, notification } = App.useApp()
  const key = 'message'

  const checkPath = useCallback(
    async (inputPath: string, outputPath: string) => {
      const isExistInput = await window.api.existsSync(inputPath)
      if (!isExistInput) {
        message.open({
          key,
          type: 'error',
          content: '输入文件不存在，请重试',
          duration: 3
        })
        return
      }
      const isExistOuput = await window.api.existsSync(outputPath)
      if (!isExistOuput) {
        message.open({
          key,
          type: 'error',
          content: '输出文件夹不存在，请重试',
          duration: 3
        })
        return
      }
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

  const cutAudio = useCallback(
    async (
      {
        inputAudio,
        outputPath,
        outputName,
        audioFormat,
        audioBitrate,
        audioQuality,
        startTime,
        endTime
      }: CutAudioParams,
      onStart?: () => void,
      onFinish?: () => void
    ) => {
      await checkPath(inputAudio, outputPath)

      const type = await window.database.selectType('音频裁剪')
      const workStatus = await window.database.selectStatus('处理中')
      const id = await window.database.insertWorkHistory({
        name: `${outputName}.${audioFormat}`,
        time: new Date().toISOString(),
        path: outputPath,
        typeId: type,
        statusId: workStatus
      })

      window.ffmpeg
        .cutAudio({
          inputAudio,
          outputAudio: `${outputPath}\\${outputName}.${audioFormat}`,
          audioFormat,
          audioBitrate: `${audioBitrate}k`,
          audioQuality,
          startTime,
          duration: endTime - startTime
        })
        .then(async () => {
          await onSuccess(id, `${outputName}.${audioFormat}`)
          onFinish?.()
        })
        .catch((msg) => {
          onError(id, msg)
        })
      window.work.set(id, '处理中').then(() => {
        message.open({
          key,
          type: 'success',
          content: '已开始处理',
          duration: 3
        })
        onStart?.()
      })
    },
    [message, checkPath, onSuccess, onError]
  )

  const setAudioTags = useCallback(
    async (
      { inputAudio, outputPath, outputName, coverPath, ...tags }: SetAudioTagsParams,
      onStart?: () => void,
      onFinish?: () => void
    ) => {
      await checkPath(inputAudio, outputPath)

      const name = await window.api.parseFilePath(inputAudio)
      const type = await window.database.selectType('音频编辑')
      const workStatus = await window.database.selectStatus('处理中')
      const id = await window.database.insertWorkHistory({
        name: `${outputName}.${name.ext}`,
        time: new Date().toISOString(),
        path: outputPath,
        typeId: type,
        statusId: workStatus
      })

      console.log({
        inputAudio,
        outputAudio: `${outputPath}\\${outputName}.${name.ext}`,
        ...tags
      })

      window.ffmpeg
        .setAudioTags({
          inputAudio,
          outputAudio: `${outputPath}\\${outputName}.${name.ext}`,
          ...tags
        })
        .then(async () => {
          await onSuccess(id, `${outputName}.${name.ext}`)
          onFinish?.()
        })
        .catch((err) => {
          onError(id, err)
        })
      window.work.set(id, '处理中').then(() => {
        message.open({
          key,
          type: 'success',
          content: '已开始处理',
          duration: 3
        })
        onStart?.()
      })
    },
    [message, checkPath, onError, onSuccess]
  )

  return { cutAudio, setAudioTags }
}
