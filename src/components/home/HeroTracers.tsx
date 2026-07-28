import { useEffect, useRef } from 'react'
import { animate } from 'motion/react'

export default function HeroTracers() {
  const tracersRef = useRef<HTMLDivElement>(null)
  const tracerRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const container = tracersRef.current
    if (
      !container ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let stopped = false
    const animations = new Set<{ stop: () => void }>()
    const timers = new Set<number>()

    const scheduleTracer = (tracer: HTMLElement, delay: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        launchTracer(tracer)
      }, delay)
      timers.add(timer)
    }

    const launchTracer = (tracer: HTMLElement) => {
      if (stopped) return

      const orientation = tracer.dataset.orientation
      const gridSize = window.innerWidth * 0.055
      const availableLines = Math.max(
        2,
        Math.floor(
          (orientation === 'x'
            ? container.clientHeight
            : container.clientWidth) / gridSize,
        ),
      )
      const gridLine = 1 + Math.floor(Math.random() * (availableLines - 1))
      const reverse = Math.random() > 0.65
      const duration = 6500 + Math.random() * 8500
      const positions =
        orientation === 'x'
          ? ['-25vw', '-19vw', '119vw', '125vw']
          : ['-25vh', '-19vh', '119vh', '125vh']
      const activePositions = reverse ? [...positions].reverse() : positions

      tracer.style.setProperty('--tracer-line', gridLine.toString())
      const animation = animate(
        tracer,
        orientation === 'x'
          ? { x: activePositions, opacity: [0, 0.75, 0.75, 0] }
          : { y: activePositions, opacity: [0, 0.75, 0.75, 0] },
        {
          duration: duration / 1000,
          ease: 'linear',
          times: [0, 0.04, 0.96, 1],
        },
      )
      animations.add(animation)
      void animation.then(() => {
        animations.delete(animation)
        if (!stopped) scheduleTracer(tracer, 500 + Math.random() * 4500)
      })
    }

    tracerRefs.current.forEach((tracer) => {
      if (tracer) scheduleTracer(tracer, Math.random() * 4000)
    })

    return () => {
      stopped = true
      timers.forEach((timer) => window.clearTimeout(timer))
      animations.forEach((animation) => animation.stop())
    }
  }, [])

  return (
    <div
      ref={tracersRef}
      className="hero-tracers absolute inset-0"
      aria-hidden="true"
    >
      {Array.from({ length: 7 }, (_, index) => (
        <i
          key={index}
          ref={(element) => {
            tracerRefs.current[index] = element
            return () => {
              tracerRefs.current[index] = null
            }
          }}
          data-orientation={index < 4 ? 'x' : 'y'}
        />
      ))}
    </div>
  )
}
