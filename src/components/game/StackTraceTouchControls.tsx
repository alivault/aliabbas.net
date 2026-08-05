import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { ChevronDown, ChevronUp, Crosshair, Pause } from 'lucide-react'
import type { StackTraceGameApi } from './stack-trace-types'

const JOYSTICK_RADIUS = 42

export default function StackTraceTouchControls({
  apiRef,
  isPortrait,
  onPause,
}: {
  apiRef: RefObject<StackTraceGameApi | null>
  isPortrait: boolean
  onPause: () => void
}) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const joystickPointer = useRef<number | null>(null)
  const lookPointer = useRef<number | null>(null)
  const lookPosition = useRef({ x: 0, y: 0, travel: 0 })
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 })

  useEffect(
    () => () => {
      apiRef.current?.setTouchInput({ forward: 0, strafe: 0, vertical: 0 })
      apiRef.current?.setTouchFiring(false)
    },
    [apiRef, isPortrait],
  )

  const updateJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const joystick = joystickRef.current
    if (!joystick) return
    const bounds = joystick.getBoundingClientRect()
    const rawX = event.clientX - (bounds.left + bounds.width / 2)
    const rawY = event.clientY - (bounds.top + bounds.height / 2)
    const distance = Math.hypot(rawX, rawY)
    const scale = distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1
    const x = rawX * scale
    const y = rawY * scale
    setStickPosition({ x, y })
    apiRef.current?.setTouchInput({
      strafe: Math.abs(x) < 4 ? 0 : x / JOYSTICK_RADIUS,
      forward: Math.abs(y) < 4 ? 0 : -y / JOYSTICK_RADIUS,
    })
  }

  const handleJoystickDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== null) return
    joystickPointer.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    updateJoystick(event)
  }

  const handleJoystickMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return
    updateJoystick(event)
  }

  const releaseJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return
    joystickPointer.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setStickPosition({ x: 0, y: 0 })
    apiRef.current?.setTouchInput({ forward: 0, strafe: 0 })
  }

  const handleLookDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== null) return
    lookPointer.current = event.pointerId
    lookPosition.current = {
      x: event.clientX,
      y: event.clientY,
      travel: 0,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleLookMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return
    const deltaX = event.clientX - lookPosition.current.x
    const deltaY = event.clientY - lookPosition.current.y
    lookPosition.current.x = event.clientX
    lookPosition.current.y = event.clientY
    lookPosition.current.travel += Math.hypot(deltaX, deltaY)
    apiRef.current?.addTouchLook(deltaX, deltaY)
  }

  const releaseLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return
    if (lookPosition.current.travel < 9) apiRef.current?.fireTouch()
    lookPointer.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const cancelLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return
    lookPointer.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const setVertical = (vertical: number) => {
    apiRef.current?.setTouchInput({ vertical })
  }

  const setFiring = (firing: boolean) => {
    apiRef.current?.setTouchFiring(firing)
  }

  const lookRegionPosition = isPortrait
    ? 'inset-x-0 top-0 bottom-32'
    : 'inset-y-0 right-0 w-[58%]'
  const pausePosition = isPortrait
    ? 'bottom-[max(1.25rem,env(safe-area-inset-bottom))]'
    : 'top-[max(0.75rem,env(safe-area-inset-top))]'

  return (
    <div className="stack-trace-touch-controls pointer-events-none absolute inset-0 z-30 select-none">
      <div
        className={`pointer-events-auto absolute touch-none ${lookRegionPosition}`}
        aria-label="Drag to aim. Tap to fire."
        onPointerDown={handleLookDown}
        onPointerMove={handleLookMove}
        onPointerUp={releaseLook}
        onPointerCancel={cancelLook}
      />

      <button
        type="button"
        onClick={onPause}
        className={`pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/65 backdrop-blur-sm ${pausePosition} ${isPortrait ? 'size-9' : 'size-10'}`}
        aria-label="Pause Stack Trace"
      >
        <Pause className="size-4" fill="currentColor" />
      </button>

      <div
        ref={joystickRef}
        className={`pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] touch-none rounded-full border border-white/20 bg-black/25 backdrop-blur-sm ${isPortrait ? 'size-24' : 'size-28'}`}
        aria-label="Flight joystick"
        onPointerDown={handleJoystickDown}
        onPointerMove={handleJoystickMove}
        onPointerUp={releaseJoystick}
        onPointerCancel={releaseJoystick}
      >
        <span className="absolute inset-4 rounded-full border border-white/10" />
        <span
          className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d9ff43]/55 bg-[#d9ff43]/12 shadow-[0_0_24px_rgb(217_255_67_/_12%)]"
          style={{
            marginLeft: stickPosition.x,
            marginTop: stickPosition.y,
          }}
        />
      </div>

      <div
        className={`pointer-events-auto absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-end ${isPortrait ? 'gap-2' : 'gap-3'}`}
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="flex size-11 touch-none items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/70 backdrop-blur-sm active:border-[#d9ff43]/70 active:bg-[#d9ff43]/20"
            aria-label="Rise"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              setVertical(1)
            }}
            onPointerUp={() => setVertical(0)}
            onPointerCancel={() => setVertical(0)}
          >
            <ChevronUp className="size-5" />
          </button>
          <button
            type="button"
            className="flex size-11 touch-none items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/70 backdrop-blur-sm active:border-[#d9ff43]/70 active:bg-[#d9ff43]/20"
            aria-label="Descend"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              setVertical(-1)
            }}
            onPointerUp={() => setVertical(0)}
            onPointerCancel={() => setVertical(0)}
          >
            <ChevronDown className="size-5" />
          </button>
        </div>
        <button
          type="button"
          className={`flex touch-none items-center justify-center rounded-full border border-[#ff694a]/70 bg-[#ff694a]/15 text-[#ff8c73] shadow-[0_0_28px_rgb(255_105_74_/_12%)] backdrop-blur-sm active:scale-95 active:bg-[#ff694a]/30 ${isPortrait ? 'size-16' : 'size-[72px]'}`}
          aria-label="Fire patch cannon"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            setFiring(true)
          }}
          onPointerUp={() => setFiring(false)}
          onPointerCancel={() => setFiring(false)}
        >
          <Crosshair className="size-7" />
        </button>
      </div>
    </div>
  )
}
