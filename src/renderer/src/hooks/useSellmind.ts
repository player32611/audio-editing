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
  const getVoice = useCallback(
    async (
      { inputVideo, outputPath, outputName, audioFormat, audioBitrate }: getVoiceParams,
      onStart?: () => void,
      onFinish?: () => void
    ) => {
      const type = await window.database.selectType('音频提取')
      const workStatus = await window.database.selectStatus('处理中')
      const data = {
        name: `${outputName}.${audioFormat}`,
        time: new Date().toISOString(),
        path: outputPath,
        typeId: type,
        statusId: workStatus
      }
      const id = await window.database.insertWorkHistory(data)

      window.sellmind
        .getVoice({
          inputVideo: inputVideo,
          outputAudio: `${outputPath}\\${outputName}.${audioFormat}`,
          audioFormat: audioFormat,
          audioBitrate: `${audioBitrate}k`
        })
        .then(async () => {
          const finishStatus = await window.database.selectStatus('已完成')
          await window.database.updateWorkHistory({ ...data, statusId: finishStatus, id })
          await window.work.delete(id)
          onFinish?.()
        })
        .catch((err) => console.log(err))
      window.work.set(id, '处理中').then(() => {
        onStart?.()
      })
    },
    []
  )

  return { getVoice }
}
