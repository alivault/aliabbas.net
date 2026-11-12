import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from 'cn'

/** Points on the edge of the orb. */
const POINTS = 72
/** The orb radius as a part of the canvas width. The rest is room to jiggle. */
const RADIUS = 0.3

// The edge is a ring of springs. Each point springs back to the resting
// shape, and pulls on its neighbors, so a poke runs around the edge as a
// ripple. Little damping: it jiggles.
const STIFFNESS = 70
const DAMPING = 4.5
const COUPLING = 900

/** Reads a CSS color as RGB, through a 1×1 canvas. */
function rgb(color: string): [number, number, number] {
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return [32, 213, 249]
  probe.fillStyle = color
  probe.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

function brandColor(element: Element) {
  return rgb(getComputedStyle(element).getPropertyValue('--brand').trim())
}

/**
 * A glowing orb above the title of the chat. It morphs slowly. Moving the
 * pointer across it drags its surface, and a press or Enter squishes it, so
 * it wobbles. With reduced motion it is still.
 */
export default function AskOrb({ className }: { className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLSpanElement>(null)
  const pokeRef = useRef<(strength: number) => void>(() => undefined)
  const reduceMotion = useReducedMotion()
  /** Squish the orb. The count of pokes is on the button, for the tests. */
  const poke = (strength: number) => {
    const button = buttonRef.current
    if (button && strength > 0) {
      button.dataset.pokes = String(Number(button.dataset.pokes ?? 0) + 1)
    }
    pokeRef.current(strength)
  }

  useEffect(() => {
    const button = buttonRef.current
    const canvas = canvasRef.current
    const glow = glowRef.current
    const context = canvas?.getContext('2d')
    if (!button || !canvas || !glow || !context) return

    const offset = new Float32Array(POINTS)
    const velocity = new Float32Array(POINTS)
    const xs = new Float32Array(POINTS)
    const ys = new Float32Array(POINTS)
    const center = { x: 0, y: 0, vx: 0, vy: 0 }
    let energy = 0
    let brand = brandColor(button)
    let size = 0
    let scale = 1
    let time = 0
    let last = 0
    let frame = 0
    let visible = true

    const resize = () => {
      scale = Math.min(window.devicePixelRatio || 1, 2)
      size = canvas.clientWidth
      canvas.width = Math.round(size * scale)
      canvas.height = Math.round(size * scale)
    }

    const draw = () => {
      const radius = size * RADIUS
      const cx = size / 2 + center.x
      const cy = size / 2 + center.y
      for (let i = 0; i < POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2
        // The resting shape morphs: a few slow waves around the edge.
        const rest =
          1 +
          0.045 * Math.sin(2 * angle + time * 0.8) +
          0.03 * Math.sin(3 * angle - time * 1.1 + 1) +
          0.02 * Math.sin(5 * angle + time * 0.6 + 2)
        const r = radius * (rest + offset[i])
        xs[i] = cx + Math.cos(angle) * r
        ys[i] = cy + Math.sin(angle) * r
      }

      const [red, green, blue] = brand
      const color = (alpha: number) => `rgba(${red},${green},${blue},${alpha})`
      context.setTransform(scale, 0, 0, scale, 0, 0)
      context.clearRect(0, 0, size, size)

      // A smooth closed curve through the midpoints of the edge.
      context.beginPath()
      const midX = (i: number) => (xs[i] + xs[(i + 1) % POINTS]) / 2
      const midY = (i: number) => (ys[i] + ys[(i + 1) % POINTS]) / 2
      context.moveTo(midX(POINTS - 1), midY(POINTS - 1))
      for (let i = 0; i < POINTS; i++) {
        context.quadraticCurveTo(xs[i], ys[i], midX(i), midY(i))
      }
      context.closePath()

      // The body, lit from the upper left. The light drifts as it morphs.
      const lightX = cx - radius * (0.35 + 0.08 * Math.sin(time * 0.5))
      const lightY = cy - radius * (0.4 + 0.08 * Math.cos(time * 0.4))
      const body = context.createRadialGradient(
        lightX,
        lightY,
        radius * 0.05,
        cx,
        cy,
        radius * 1.15,
      )
      body.addColorStop(0, `rgba(255,255,255,${0.85 + energy * 0.15})`)
      body.addColorStop(0.3, color(0.95))
      body.addColorStop(0.75, color(0.75))
      body.addColorStop(1, color(0.45))
      context.shadowColor = color(0.9)
      context.shadowBlur = radius * (0.45 + energy * 0.5)
      context.fillStyle = body
      context.fill()

      // A darker rim gives the orb its depth.
      context.shadowBlur = 0
      const rim = context.createRadialGradient(
        cx,
        cy,
        radius * 0.6,
        cx,
        cy,
        radius * 1.1,
      )
      rim.addColorStop(0, 'rgba(0,0,0,0)')
      rim.addColorStop(1, 'rgba(0,0,0,0.28)')
      context.fillStyle = rim
      context.fill()

      glow.style.opacity = String(0.45 + energy * 0.4)
      glow.style.transform = `translate(${center.x}px, ${center.y}px) scale(${1 + energy * 0.15})`
    }

    const step = (dt: number) => {
      time += dt
      for (let i = 0; i < POINTS; i++) {
        const before = offset[(i + POINTS - 1) % POINTS]
        const after = offset[(i + 1) % POINTS]
        const pull = (before + after - 2 * offset[i]) * COUPLING
        velocity[i] +=
          (-STIFFNESS * offset[i] - DAMPING * velocity[i] + pull / POINTS) * dt
      }
      for (let i = 0; i < POINTS; i++) offset[i] += velocity[i] * dt
      // The center bounces on its own spring.
      center.vx += (-120 * center.x - 9 * center.vx) * dt
      center.vy += (-120 * center.y - 9 * center.vy) * dt
      center.x += center.vx * dt
      center.y += center.vy * dt
      energy *= Math.exp(-dt * 1.6)
    }

    const tick = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 1 / 30)
      last = now
      // Small steps keep the stiff springs stable.
      for (let left = dt; left > 0; left -= 1 / 120) {
        step(Math.min(left, 1 / 120))
      }
      draw()
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (reduceMotion || frame || !visible || document.hidden) return
      last = 0
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    /**
     * A squish of the whole orb (a negative strength pushes it out), then a
     * wobble with a few random lobes.
     */
    pokeRef.current = (strength: number) => {
      if (reduceMotion) return
      const phase = Math.random() * Math.PI * 2
      for (let i = 0; i < POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2
        velocity[i] -= strength * (1 + 0.6 * Math.sin(3 * angle + phase))
      }
      center.vy += strength * 60
      energy = Math.min(1, energy + 0.8)
      start()
    }

    // The surface follows the pointer: a move outward pulls the edge near
    // the pointer out, and a move inward pushes it in.
    let previous: { x: number; y: number } | null = null
    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion) return
      const box = canvas.getBoundingClientRect()
      const x = event.clientX - box.left - box.width / 2
      const y = event.clientY - box.top - box.height / 2
      if (previous) {
        const radius = size * RADIUS
        const distance = Math.hypot(x, y)
        if (distance < radius * 1.6) {
          const angle = Math.atan2(y, x)
          const radial =
            ((x - previous.x) * Math.cos(angle) +
              (y - previous.y) * Math.sin(angle)) /
            radius
          for (let i = 0; i < POINTS; i++) {
            const pointAngle = (i / POINTS) * Math.PI * 2
            const apart = Math.abs(
              Math.atan2(
                Math.sin(pointAngle - angle),
                Math.cos(pointAngle - angle),
              ),
            )
            if (apart < 0.7) {
              const weight = Math.cos((apart / 0.7) * (Math.PI / 2)) ** 2
              velocity[i] += radial * weight * 9
            }
          }
          energy = Math.min(1, energy + 0.02)
        }
      }
      previous = { x, y }
    }
    const onPointerLeave = () => {
      previous = null
    }

    resize()
    brand = brandColor(button)
    draw()
    start()

    const resizeObserver = new ResizeObserver(() => {
      resize()
      draw()
    })
    resizeObserver.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      if (visible) start()
      else stop()
    })
    intersection.observe(canvas)
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    const onScheme = () => {
      brand = brandColor(button)
      draw()
    }
    scheme.addEventListener('change', onScheme)
    button.addEventListener('pointermove', onPointerMove)
    button.addEventListener('pointerleave', onPointerLeave)

    return () => {
      stop()
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      scheme.removeEventListener('change', onScheme)
      button.removeEventListener('pointermove', onPointerMove)
      button.removeEventListener('pointerleave', onPointerLeave)
      pokeRef.current = () => undefined
    }
  }, [reduceMotion])

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Poke the orb"
      // A press squishes the orb, and the release lets it spring back out.
      onPointerDown={() => poke(3)}
      onPointerUp={() => poke(-1.8)}
      onKeyDown={(event) => {
        if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
        event.preventDefault()
        poke(3)
      }}
      className={cn(
        'focus-visible:ring-ring/50 relative size-24 shrink-0 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-3 lg:size-28',
        className,
      )}
    >
      {/* The soft light around the orb. */}
      <span
        ref={glowRef}
        aria-hidden="true"
        className="bg-brand/40 pointer-events-none absolute inset-[-20%] rounded-full opacity-50 blur-2xl"
      />
      {/* Larger than the button, so the edge can bulge out. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-33%] size-[166%]"
      />
    </button>
  )
}
