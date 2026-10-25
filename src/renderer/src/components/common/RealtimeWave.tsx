import { useCallback, useEffect, useRef, type ReactNode } from 'react'

interface RealtimeWaveParams {
  isRecording: boolean
}

export function RealtimeWave({ isRecording }: RealtimeWaveParams): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationId = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const contentRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const onUpdate = useCallback((): void => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!canvasRef.current || !ctx || !analyserRef.current) return

    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)

    const { width, height } = canvasRef.current

    // 每一帧清空画布，不保留之前的频谱
    ctx.clearRect(0, 0, width, height)

    const barCount = 64
    const gap = 3
    const barWidth = (width - gap * (barCount - 1)) / barCount

    for (let i = 0; i < barCount; i++) {
      const index = Math.floor(Math.pow(i / barCount, 2) * data.length)

      const magnitude = data[index] / 255
      const barHeight = magnitude * height

      ctx.fillStyle = '#1677ff'
      ctx.fillRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight)
    }

    animationId.current = requestAnimationFrame(onUpdate)
  }, [])

  const onStart = useCallback(async () => {
    await navigator.mediaDevices
      .getUserMedia({
        audio: true
      })
      .then((stream) => {
        streamRef.current = stream
      })
      .catch((err) => {
        console.error('获取实时频谱失败:', err)
      })

    if (!streamRef.current) return

    contentRef.current = new AudioContext()

    const source = contentRef.current.createMediaStreamSource(streamRef.current)

    analyserRef.current = contentRef.current.createAnalyser()
    analyserRef.current.fftSize = 2048
    analyserRef.current.smoothingTimeConstant = 0.7

    source.connect(analyserRef.current)

    onUpdate()
  }, [onUpdate])

  useEffect(() => {
    if (!isRecording) return

    onStart()

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      contentRef.current?.close()
    }
  }, [isRecording, animationId, onStart])

  return (
    <canvas
      ref={canvasRef}
      height={180}
      style={{
        display: 'block',
        width: '100%',
        height: 100
      }}
    />
  )
}
