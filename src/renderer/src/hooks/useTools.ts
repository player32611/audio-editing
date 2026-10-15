import { App } from 'antd'
import { useCallback } from 'react'
import type {
  AudioFileExtension,
  AudioTag,
  Language,
  WhisperModel,
  WhisperModelOutputExtension
} from '../../../shared/type'
import { KEY } from '@renderer/utils'
import { SINGAL } from '../../../shared/constants'

interface useToolsData {
  getVoice: (params: getVoiceParams) => Promise<void>
  cutAudio: (params: CutAudioParams) => Promise<void>
  setAudioTags: (params: SetAudioTagsParams) => Promise<void>
  speechRecognize: (params: speechRecognizeParams) => Promise<void>
}

interface getVoiceParams {
  inputVideo: string
  outputAudio: string
  audioExtension: AudioFileExtension
  audioBitrate: string
  audioQuality: number
  startTime: number
  duration: number
}

interface CutAudioParams {
  inputAudio: string
  outputAudio: string
  audioExtension: AudioFileExtension
  audioBitrate: string
  audioQuality: number
  startTime: number
  duration: number
}

interface SetAudioTagsParams extends AudioTag {
  inputAudio: string
  outputAudio: string
  coverPath?: string
}

interface speechRecognizeParams {
  inputAudio: string
  outputFileWithoutExt: string
  outputExtension: WhisperModelOutputExtension
  language: Language
  model: WhisperModel
  prompt: string
  translate: boolean
  useGPU: boolean
}

export function useTools(): useToolsData {
  const { message, notification, modal } = App.useApp()

  const checkPath = useCallback(
    async (inputFile: string, outputFile: string, coverFile?: string): Promise<boolean> => {
      const openMessage = (msg: string): void => {
        message.open({
          key: KEY.MESSAGE,
          type: 'error',
          content: msg,
          duration: 3
        })
      }

      const isExistInput = await window.api.existsSync(inputFile)
      if (!isExistInput) {
        openMessage('输入文件不存在，请检查后重试')
        return false
      }

      const isExistOutputFile = await window.api.existsSync(outputFile)
      if (isExistOutputFile) {
        openMessage('已存在同名文件，请修改后重试')
        return false
      }

      const outputInfo = await window.api.parseFilePath(outputFile)
      const isExistOutputPath = await window.api.existsSync(outputInfo.dir)
      if (!isExistOutputPath) {
        openMessage('输出文件夹不存在，请修改后重试')
        return false
      }

      if (coverFile) {
        const isExistOuput = await window.api.existsSync(coverFile)
        if (!isExistOuput) {
          openMessage('封面图片不存在，请修改后重试')
          return false
        }
      }

      return true
    },
    [message]
  )

  const checkModel = useCallback(
    async (model: WhisperModel) => {
      const existModel = await window.whisper.checkModel(model)
      if (existModel) return true
      const ifDownload = await modal.confirm({
        title: '模型未下载',
        content: '当前选择模型暂未下载，是否先下载模型？',
        okText: '下载'
      })
      if (!ifDownload) return false

      message.open({
        key: KEY.MESSAGE,
        type: 'loading',
        content: '正在下载模型 0.00%',
        duration: 0
      })
      const unsubscribe = window.whisper.onDownloadProgress((progress) => {
        message.open({
          key: KEY.MESSAGE,
          type: 'loading',
          content: `正在下载模型 ${(progress.percent * 100).toFixed(2)}%`,
          duration: 0
        })
      })
      try {
        await window.whisper.downloadModel(model)
        message.open({
          key: KEY.MESSAGE,
          type: 'success',
          content: '模型下载成功',
          duration: 3
        })
        return true
      } catch (err) {
        console.log(err)
        message.open({
          key: KEY.MESSAGE,
          type: 'error',
          content: `模型下载失败: ${err}`,
          duration: 3
        })
        return false
      } finally {
        unsubscribe()
      }
    },
    [message, modal]
  )

  const onBegin = useCallback(
    async (id: number) => {
      await window.work.set(id, { status: '处理中', progress: 0 })
      message.open({
        key: KEY.MESSAGE,
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
    async (id: number, err: Error) => {
      console.log(err)
      const failedId = await window.database.selectStatus('已中断')
      window.database.updateWorkHistory(id, { statusId: failedId })
      window.work.delete(id)
      if (err?.message.includes(SINGAL.SIGKILL)) return
      message.open({
        key: KEY.MESSAGE,
        type: 'error',
        content: err?.message ? `发生错误: ${err.message}` : '发生未知错误，请重试',
        duration: 3
      })
    },
    [message]
  )

  const getVoice = useCallback(
    async (params: getVoiceParams) => {
      const checked = await checkPath(params.inputVideo, params.outputAudio)
      if (!checked) throw new Error('路径有误')

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

      await onBegin(id)
      window.ffmpeg
        .getVoice(params, id)
        .then(() => {
          onSuccess(id, outputInfo.fullName)
        })
        .catch((err: Error) => {
          onError(id, err)
        })
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

      await onBegin(id)
      window.ffmpeg
        .cutAudio(params, id)
        .then(() => {
          onSuccess(id, outputInfo.fullName)
        })
        .catch((err: Error) => {
          onError(id, err)
        })
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

      await onBegin(id)
      window.ffmpeg
        .setAudioTags(params, id)
        .then(() => {
          onSuccess(id, outputInfo.fullName)
        })
        .catch((err: Error) => {
          onError(id, err)
        })
    },
    [checkPath, onBegin, onSuccess, onError]
  )

  const speechRecognize = useCallback(
    async (params: speechRecognizeParams) => {
      let checked = await checkPath(
        params.inputAudio,
        `${params.outputFileWithoutExt}.${params.outputExtension}`
      )
      if (!checked) throw new Error('路径有误')

      checked = await checkModel(params.model)
      if (!checked) throw new Error('模型未下载')

      const outputInfo = await window.api.parseFilePath(params.outputFileWithoutExt)
      const type = await window.database.selectType('语音识别')
      const workStatus = await window.database.selectStatus('处理中')
      const id = await window.database.insertWorkHistory({
        name: `${outputInfo.fullName}.${params.outputExtension}`,
        time: new Date().toISOString(),
        path: outputInfo.dir,
        typeId: type,
        statusId: workStatus
      })

      await onBegin(id)
      window.whisper
        .transcribe(params, id)
        .then(() => {
          onSuccess(id, outputInfo.fullName)
        })
        .catch((err: Error) => {
          onError(id, err)
        })
    },
    [checkPath, checkModel, onBegin, onSuccess, onError]
  )

  return { getVoice, cutAudio, setAudioTags, speechRecognize }
}
