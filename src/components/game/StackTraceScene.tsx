import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import StackTraceEngine from './stack-trace-engine'
import type {
  GameHudState,
  GameResult,
  StackTraceGameApi,
} from './stack-trace-types'

export default function StackTraceScene({
  apiRef,
  onReady,
  onHudChange,
  onPauseChange,
  onEnd,
}: {
  apiRef: RefObject<StackTraceGameApi | null>
  onReady: () => void
  onHudChange: (hud: GameHudState) => void
  onPauseChange: (paused: boolean) => void
  onEnd: (result: GameResult) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const callbacksRef = useRef({
    onReady,
    onHudChange,
    onPauseChange,
    onEnd,
  })
  callbacksRef.current = { onReady, onHudChange, onPauseChange, onEnd }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new StackTraceEngine(canvas, {
      onHudChange: (hud) => callbacksRef.current.onHudChange(hud),
      onPauseChange: (paused) => callbacksRef.current.onPauseChange(paused),
      onEnd: (result) => callbacksRef.current.onEnd(result),
    })
    apiRef.current = {
      start: engine.start,
      resume: engine.resume,
    }
    callbacksRef.current.onReady()

    return () => {
      apiRef.current = null
      engine.dispose()
    }
  }, [apiRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full outline-none"
      tabIndex={-1}
      aria-label="Stack Trace, a three-dimensional zero-gravity labyrinth game"
    />
  )
}
