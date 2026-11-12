import { useEffect, useRef } from 'react'
import { hasFastWebGL } from '~/lib/webgl'
import { useReducedMotion } from 'motion/react'
import { cn } from 'cn'
import { ORB_GLSL, ORB_POINTS, OrbBody } from '~/lib/orb'

/**
 * The orb radius as a part of the canvas width: the canvas is 3 radii from
 * the center to each side, so the orb can jiggle and stretch freely.
 */
const RADIUS = 1 / 6
/** A press that moves less than this, in CSS pixels, is a click. */
const CLICK_SLOP = 6

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

/** The orb (src/lib/orb.ts) on a flat canvas, in device pixels. */
const FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uResolution;   // canvas, device pixels
uniform vec2 uCenter;       // orb center, device pixels from the top left
uniform float uRadius;      // device pixels
uniform float uSeed;        // changes each frame, for the grain
${ORB_GLSL}
void main() {
  vec2 pixel = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 p = (pixel - uCenter) / uRadius;
  // Fade the halo out before the canvas border, so no edge shows.
  vec2 border = min(pixel, uResolution - pixel) / (uRadius * 0.5);
  float fade = clamp(min(border.x, border.y), 0.0, 1.0);
  fragColor = orbColor(p, 1.5 / uRadius, fade,
    orbHash(gl_FragCoord.xy + uSeed));
}
`

/** Reads a CSS color as RGB, through a 1×1 canvas. */
function rgb(color: string): [number, number, number] {
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return [32, 213, 249]
  probe.fillStyle = color
  probe.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

function token(element: Element, name: string) {
  return rgb(getComputedStyle(element).getPropertyValue(name).trim())
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

const UNIFORMS = [
  'uResolution',
  'uCenter',
  'uRadius',
  'uEdge',
  'uFlow',
  'uTwist',
  'uEnergy',
  'uTilt',
  'uBase',
  'uSeed',
] as const
type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>

/**
 * The shader on the canvas, or null if the browser has no WebGL 2 on a GPU.
 * Then the flat 2D orb shows.
 */
function makeShader(canvas: HTMLCanvasElement) {
  if (!hasFastWebGL()) return null
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true })
  if (!gl) return null
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  // One triangle that covers the canvas.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const position = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const uniforms = Object.fromEntries(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Uniforms
  return { gl, uniforms }
}

/**
 * A marble of light above the title of the chat. It morphs slowly. Moving
 * the pointer across it drags its surface and turns the light inside, and a
 * press or Enter squishes it, so it wobbles. With reduced motion it is
 * still.
 */
export default function AskOrb({ className }: { className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLSpanElement>(null)
  const pressRef = useRef<(down: boolean) => void>(() => undefined)
  const reduceMotion = useReducedMotion()
  /**
   * Press (the orb shrinks and stays small, morphing) or let go (it springs
   * back up). A full press and release (a click or a key, not a drag) is one
   * poke. The count is on the button, for the tests.
   */
  const press = (down: boolean, counted = true) => {
    const button = buttonRef.current
    if (button && counted && !down) {
      button.dataset.pokes = String(Number(button.dataset.pokes ?? 0) + 1)
    }
    pressRef.current(down)
  }

  useEffect(() => {
    const button = buttonRef.current
    const canvas = canvasRef.current
    const glow = glowRef.current
    if (!button || !canvas || !glow) return
    const shader = makeShader(canvas)
    const context = shader ? null : canvas.getContext('2d')
    if (!shader && !context) return

    const body = new OrbBody()
    const xs = new Float32Array(ORB_POINTS)
    const ys = new Float32Array(ORB_POINTS)
    /** Where a press started, in CSS pixels, to tell a click from a drag. */
    const from = { x: 0, y: 0 }
    let brand = token(button, '--brand')
    let base = token(button, '--chrome')
    let size = 0
    let scale = 1
    let last = 0
    let frame = 0
    let visible = true

    const resize = () => {
      scale = Math.min(window.devicePixelRatio || 1, 2)
      size = canvas.clientWidth
      canvas.width = Math.round(size * scale)
      canvas.height = Math.round(size * scale)
    }

    const drawShader = (gl: WebGL2RenderingContext, uniforms: Uniforms) => {
      const radius = size * RADIUS
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
      gl.uniform2f(
        uniforms.uCenter,
        (size / 2 + body.center.x * radius) * scale,
        (size / 2 + body.center.y * radius) * scale,
      )
      gl.uniform1f(uniforms.uRadius, radius * scale)
      gl.uniform1fv(uniforms.uEdge, body.edges)
      gl.uniform1f(uniforms.uFlow, body.phase.flow)
      gl.uniform1f(uniforms.uTwist, body.phase.twist)
      gl.uniform1f(uniforms.uEnergy, body.energy)
      gl.uniform2f(uniforms.uTilt, body.tilt.x, body.tilt.y)
      gl.uniform3f(uniforms.uBase, base[0] / 255, base[1] / 255, base[2] / 255)
      gl.uniform1f(uniforms.uSeed, (performance.now() % 1000) / 7.3)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    /** Without WebGL 2: a plain glowing blob in the brand color. */
    const drawFlat = (ctx: CanvasRenderingContext2D) => {
      const radius = size * RADIUS
      const cx = size / 2 + body.center.x * radius
      const cy = size / 2 + body.center.y * radius
      const { edges, energy } = body
      for (let i = 0; i < ORB_POINTS; i++) {
        const angle = (i / ORB_POINTS) * Math.PI * 2
        xs[i] = cx + Math.cos(angle) * radius * edges[i]
        ys[i] = cy + Math.sin(angle) * radius * edges[i]
      }
      const [red, green, blue] = brand
      const color = (alpha: number) => `rgba(${red},${green},${blue},${alpha})`
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.clearRect(0, 0, size, size)
      ctx.beginPath()
      const midX = (i: number) => (xs[i] + xs[(i + 1) % ORB_POINTS]) / 2
      const midY = (i: number) => (ys[i] + ys[(i + 1) % ORB_POINTS]) / 2
      ctx.moveTo(midX(ORB_POINTS - 1), midY(ORB_POINTS - 1))
      for (let i = 0; i < ORB_POINTS; i++) {
        ctx.quadraticCurveTo(xs[i], ys[i], midX(i), midY(i))
      }
      ctx.closePath()
      const gradient = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.05,
        cx,
        cy,
        radius * 1.15,
      )
      gradient.addColorStop(0, `rgba(255,255,255,${0.85 + energy * 0.15})`)
      gradient.addColorStop(0.3, color(0.95))
      gradient.addColorStop(1, color(0.45))
      ctx.shadowColor = color(0.9)
      ctx.shadowBlur = radius * (0.45 + energy * 0.5)
      ctx.fillStyle = gradient
      ctx.fill()
      ctx.shadowBlur = 0
    }

    const draw = () => {
      body.updateEdges()
      if (shader) drawShader(shader.gl, shader.uniforms)
      else if (context) drawFlat(context)
      const radius = size * RADIUS
      glow.style.opacity = String(0.3 + body.energy * 0.35)
      glow.style.transform = `translate(${body.center.x * radius}px, ${body.center.y * radius}px) rotate(${body.phase.flow * 20}deg) scale(${body.squeeze.value * (1 + body.energy * 0.15)})`
    }

    const tick = (now: number) => {
      const dt = (now - (last || now)) / 1000
      last = now
      body.advance(dt)
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

    pressRef.current = (down: boolean) => {
      if (reduceMotion) return
      body.press(down)
      start()
    }

    /** The pointer from the orb center, in CSS pixels. */
    const pointer = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect()
      return {
        x: event.clientX - box.left - box.width / 2,
        y: event.clientY - box.top - box.height / 2,
      }
    }

    // Press and drag to stretch the orb. A press that does not move is a
    // click: it pokes the orb.
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || reduceMotion) return
      button.setPointerCapture(event.pointerId)
      const { x, y } = pointer(event)
      from.x = x
      from.y = y
      const radius = size * RADIUS
      body.grab(x / radius, y / radius)
      start()
    }
    const onPointerUp = (event: PointerEvent) => {
      if (!body.drag.active) return
      delete button.dataset.stretching
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId)
      }
      const click = body.release()
      if (click && event.type === 'pointerup') {
        button.dataset.pokes = String(Number(button.dataset.pokes ?? 0) + 1)
      }
      start()
    }
    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion) return
      const { x, y } = pointer(event)
      if (
        body.drag.active &&
        !body.drag.moved &&
        Math.hypot(x - from.x, y - from.y) > CLICK_SLOP
      ) {
        body.stretch()
        button.dataset.stretching = ''
      }
      const radius = size * RADIUS
      body.hover(x / radius, y / radius)
    }
    const onPointerLeave = () => body.leave()

    resize()
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
      brand = token(button, '--brand')
      base = token(button, '--chrome')
      draw()
    }
    scheme.addEventListener('change', onScheme)
    button.addEventListener('pointerdown', onPointerDown)
    button.addEventListener('pointermove', onPointerMove)
    button.addEventListener('pointerup', onPointerUp)
    button.addEventListener('pointercancel', onPointerUp)
    button.addEventListener('pointerleave', onPointerLeave)

    return () => {
      stop()
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      scheme.removeEventListener('change', onScheme)
      button.removeEventListener('pointerdown', onPointerDown)
      button.removeEventListener('pointermove', onPointerMove)
      button.removeEventListener('pointerup', onPointerUp)
      button.removeEventListener('pointercancel', onPointerUp)
      button.removeEventListener('pointerleave', onPointerLeave)
      pressRef.current = () => undefined
    }
  }, [reduceMotion])

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Poke the orb"
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        if (!event.repeat) press(true)
      }}
      onKeyUp={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        press(false)
      }}
      className={cn(
        'focus-visible:ring-ring/50 relative size-24 shrink-0 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-3 lg:size-28',
        className,
      )}
    >
      {/* The soft light around the orb, in the colors of the chrome ring
          of the buttons. */}
      <span
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-15%] rounded-full bg-[conic-gradient(oklch(0.55_0.21_265),oklch(0.78_0.15_225),oklch(0.82_0.15_70),oklch(0.66_0.22_15),oklch(0.55_0.26_295),oklch(0.55_0.21_265))] opacity-30 blur-2xl"
      />
      {/* Three times the button, so the orb can stretch out. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-100%] size-[300%]"
      />
    </button>
  )
}
