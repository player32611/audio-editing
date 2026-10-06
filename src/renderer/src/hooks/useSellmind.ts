import { App } from 'antd'
import { useCallback } from 'react'
import type { AudioFormat } from '../../../shared/type'

interface useSellmindData {
  getVoice: (params: getVoiceParams, onStart?: () => void, onFinish?: () => void) => Promise<void>
}

interface getVoiceParams {
  inputVideo: string
  outputPath: string
  outputName: string
  audioFormat: AudioFormat
  audioBitrate: number
}

export default function useSellmind(): useSellmindData {
  const { message, notification } = App.useApp()

  const getVoice = useCallback(
    async (
      { inputVideo, outputPath, outputName, audioFormat, audioBitrate }: getVoiceParams,
      onStart?: () => void,
      onFinish?: () => void
    ) => {
      const type = await window.database.selectType('音频提取')
      const workStatus = await window.database.selectStatus('处理中')
      const id = await window.database.insertWorkHistory({
        name: `${outputName}.${audioFormat}`,
        time: new Date().toISOString(),
        path: outputPath,
        typeId: type,
        statusId: workStatus
      })

      window.sellmind
        .getVoice({
          inputVideo: inputVideo,
          outputAudio: `${outputPath}\\${outputName}.${audioFormat}`,
          audioFormat: audioFormat,
          audioBitrate: `${audioBitrate}k`
        })
        .then(async () => {
          const finishStatus = await window.database.selectStatus('已完成')
          await window.database.updateWorkHistory(id, { statusId: finishStatus })
          await window.work.delete(id)
          notification.success({
            title: '任务完成',
            description: `您的 ${outputName}.${audioFormat} 已处理完成，请查看`,
            showProgress: true
          })
          onFinish?.()
        })
        .catch((err) => console.log(err))
      window.work.set(id, '处理中').then(() => {
        message.success('已开始处理')
        onStart?.()
      })
    },
    [message, notification]
  )

  return { getVoice }
}
