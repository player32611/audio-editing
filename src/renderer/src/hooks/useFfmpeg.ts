import { App } from 'antd'
import { useCallback } from 'react'
import type { AudioFileExtension } from '../../../shared/type'

interface useFfmpegData {
  cutAudio: (params: CutAudioParams, onStart?: () => void, onFinish?: () => void) => Promise<void>
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

export function useFfmpeg(): useFfmpegData {
  const { message, notification } = App.useApp()
  const key = 'message'

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
      const isExistInput = await window.api.existsSync(inputAudio)
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
          const finishStatus = await window.database.selectStatus('已完成')
          await window.database.updateWorkHistory(id, { statusId: finishStatus })
          await window.work.delete(id)
          notification.success({
            title: '任务完成',
            description: `您的 ${outputName}.${audioFormat} 已处理完成，请查看`,
            showProgress: true,
            duration: 3
          })
          onFinish?.()
        })
        .catch(async () => {
          const failedId = await window.database.selectStatus('已中断')
          window.database.updateWorkHistory(id, { statusId: failedId })
          window.work.delete(id)
          message.open({
            key,
            type: 'error',
            content: '发生未知错误，请重试',
            duration: 3
          })
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
    [message, notification]
  )

  return { cutAudio }
}
