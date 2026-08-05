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
  onError,
  onHudChange,
  onPauseChange,
  onMapChange,
  onEnd,
}: {
  apiRef: RefObject<StackTraceGameApi | null>
  onReady: () => void
  onError: () => void
  onHudChange: (hud: GameHudState) => void
  onPauseChange: (paused: boolean) => void
  onMapChange: (open: boolean) => void
  onEnd: (result: GameResult) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const callbacksRef = useRef({
    onReady,
    onError,
    onHudChange,
    onPauseChange,
    onMapChange,
    onEnd,
  })
  callbacksRef.current = {
    onReady,
    onError,
    onHudChange,
    onPauseChange,
    onMapChange,
    onEnd,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let engine: StackTraceEngine
    try {
      engine = new StackTraceEngine(canvas, {
        onHudChange: (hud) => callbacksRef.current.onHudChange(hud),
        onPauseChange: (paused) => callbacksRef.current.onPauseChange(paused),
        onMapChange: (open) => callbacksRef.current.onMapChange(open),
        onEnd: (result) => callbacksRef.current.onEnd(result),
      })
    } catch {
      callbacksRef.current.onError()
      return
    }
    apiRef.current = {
      start: engine.start,
      resume: engine.resume,
      pause: engine.pause,
      toggleMap: engine.toggleMap,
      setTouchInput: engine.setTouchInput,
      addTouchLook: engine.addTouchLook,
      setTouchFiring: engine.setTouchFiring,
      fireTouch: engine.fireTouch,
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
      className="absolute inset-0 size-full touch-none outline-none"
      tabIndex={-1}
      aria-label="Stack Trace, a three-dimensional zero-gravity labyrinth game"
    />
  )
}
