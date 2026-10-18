import { Slider, SliderRangeProps } from 'antd'
import {
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode
} from 'react'
import WaveSurfer from 'wavesurfer.js'
import { formatSeconds } from '@renderer/utils'
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions.js'

interface AudioWaveParams {
  value?: [number, number]
  url: string
  ref: Ref<AudioWaveRef>
  onChange?: (value: [number, number]) => void
  onPlayChange?: (isPlaying: boolean) => void
}

export interface AudioWaveRef {
  isPlaying: boolean
  playPause: () => boolean
}

const config: SliderRangeProps = {
  min: 0,
  step: 0.01,
  tooltip: {
    formatter: (value) => formatSeconds(value || 0),
    placement: 'bottom'
  },
  disabled: true,
  range: true
}

export function AudioWave({ value, url, ref, onChange, onPlayChange }: AudioWaveParams): ReactNode {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [sliderConfig, setSliderConfig] = useState<SliderRangeProps>(config)
  const isDragging = useRef<boolean>(false)
  const pointerPercent = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pointerRef = useRef<HTMLDivElement | null>(null)
  const waveSurferRef = useRef<WaveSurfer | null>(null)
  const regionRef = useRef<Region | null>(null)
  const onChangeRef = useRef<(value: [number, number]) => void>(onChange)
  const onPlayChangeRef = useRef<(isPlaying: boolean) => void>(onPlayChange)

  const onPointerUpdate = useCallback((percent: number) => {
    if (!waveSurferRef.current || !pointerRef.current) return

    const duration = waveSurferRef.current.getDuration()

    pointerPercent.current = percent
    waveSurferRef.current.setTime(percent * duration)
    pointerRef.current.style.left = `${percent * 100}%`
  }, [])

  const onSelectRange = useCallback(
    ([start, end]: [number, number]) => {
      if (!value) onChange?.([start, end])
      else if (start !== value[0] || end !== value[1]) {
        onChange?.([start, end])
        regionRef.current?.setOptions({ start, end })
      }
    },
    [value, onChange]
  )

  const onPointerDown = useCallback(() => {
    isDragging.current = true
  }, [])

  const onPointerMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current || !waveSurferRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)

      onPointerUpdate(percent)
    },
    [onPointerUpdate]
  )

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    if (!containerRef.current || !url) return

    const regions = RegionsPlugin.create()
    waveSurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#64748b',
      progressColor: '#3b82f6',
      cursorColor: '#f97316',
      barWidth: 1,
      barGap: 1,
      normalize: true,
      plugins: [regions],
      interact: false
    })
    window.api.readFile(url).then((res) => {
      const blob = new Blob([res], {
        type: 'audio/flac'
      })

      waveSurferRef.current?.loadBlob(blob)
    })

    waveSurferRef.current.on('ready', () => {
      if (!waveSurferRef.current) return

      const duration = waveSurferRef.current.getDuration()

      onChangeRef.current?.([0, duration])
      pointerPercent.current = 0

      setSliderConfig({
        ...config,
        max: duration,
        disabled: false,
        marks: {
          0: formatSeconds(0),
          [duration]: formatSeconds(duration)
        }
      })

      regionRef.current = regions.addRegion({
        start: 0,
        end: duration,
        color: 'rgba(22, 119, 255, 0.25)',
        drag: false,
        resize: false
      })
    })

    waveSurferRef.current.on('play', () => {
      onPlayChangeRef.current?.(true)
    })

    waveSurferRef.current.on('pause', () => {
      onPlayChangeRef.current?.(false)
    })

    waveSurferRef.current.on('finish', () => {
      onPlayChangeRef.current?.(false)
    })

    waveSurferRef.current.on('audioprocess', (time) => {
      if (!waveSurferRef.current || !pointerRef.current) return

      const duration = waveSurferRef.current.getDuration()
      const percent = time / duration
      pointerPercent.current = percent
      pointerRef.current.style.left = `${percent * 100}%`
    })

    document.addEventListener('mousemove', onPointerMove)
    document.addEventListener('mouseup', onPointerUp)

    return () => {
      waveSurferRef.current?.destroy()
      waveSurferRef.current = null
      regionRef.current = null
      document.removeEventListener('mousemove', onPointerMove)
      document.removeEventListener('mouseup', onPointerUp)
    }
  }, [url, onPointerUpdate, onPointerMove, onPointerUp])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onPlayChangeRef.current = onPlayChange
  }, [onPlayChange])

  useImperativeHandle(
    ref,
    () => ({
      isPlaying,
      playPause() {
        if (!waveSurferRef.current) return false

        waveSurferRef.current.playPause()
        setIsPlaying(waveSurferRef.current.isPlaying())
        return waveSurferRef.current.isPlaying()
      }
    }),
    [isPlaying]
  )

  return (
    <>
      <div ref={containerRef} style={{ display: url ? 'block' : 'none' }}></div>
      <div style={{ position: 'relative' }}>
        <Slider
          {...sliderConfig}
          value={value}
          onChange={(val) => onSelectRange(val as [number, number])}
          range
        />
        <div
          ref={pointerRef}
          onMouseDown={onPointerDown}
          style={{
            display: url ? 'block' : 'none',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 12,
            transform: 'translateX(-50%)',
            cursor: 'col-resize'
          }}
        >
          <div
            style={{
              width: 2,
              height: '100%',
              margin: '0 auto',
              background: '#f97316'
            }}
          />
        </div>
      </div>
    </>
  )
}
