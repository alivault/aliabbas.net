/**
 * Chrome ring on the border of a primary or secondary button, on hover: a
 * thin ring of polished metal with prism fringes (each color channel sits a
 * little to the side), a bright highlight that moves around it, and a soft
 * glow outside it.
 *
 * One canvas and one WebGL context serve the whole site. The canvas moves
 * into the button under the pointer and extends PAD pixels outside it, for
 * the glow. The loop runs only while a button is hovered. Buttons opt in
 * with the `chrome-ring` class; the CSS, and the fallback without WebGL,
 * are in globals.css.
 */
import { DURATIONS, EASE_IN, EASE_OUT } from '~/lib/design/motion'

/** How far the canvas extends outside the button, in CSS pixels. */
const PAD = 16

const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform vec2 uCanvas;   // canvas size, CSS pixels
uniform vec2 uButton;   // button size, CSS pixels
uniform float uTime;
uniform float uDark;    // 1 in dark mode

// Distance to a box with round corners, in pixels. Negative inside.
float roundBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

float profile(float d, float width) {
  return exp(-(d * d) / (width * width));
}

void main() {
  vec2 p = (vUv - 0.5) * uCanvas;
  vec2 halfSize = uButton * 0.5;
  float radius = min(halfSize.x, halfSize.y);
  float t = uTime;

  // Where on the ring this pixel is, as an angle.
  float angle = atan(p.y / halfSize.y, p.x / halfSize.x);
  // The light goes around the ring once every 6 seconds, on its own.
  float light = 2.35 - t * 6.28318 / 6.0;

  // The highlight: hot where the light is, with a weaker one opposite.
  float toLight = 0.5 + 0.5 * cos(angle - light);
  float highlight = pow(toLight, 6.0) + 0.25 * pow(1.0 - toLight, 10.0);

  // The ring sits on the 1px border, and its shape wobbles a little.
  float wobble = 0.15 * sin(angle * 3.0 + t * 1.3)
    + 0.1 * sin(angle * 5.0 - t * 1.7);
  float d = roundBox(p, halfSize, radius) + 0.5 + wobble;

  // Prism fringes: each channel at a small offset, which changes along the
  // ring, so the edges split into colors. They are widest at the highlight.
  float spread = 0.35 + 0.25 * sin(angle * 2.0 - t * 1.1) + 0.8 * highlight;
  float width = 0.6 + 0.7 * highlight;
  vec3 ring = vec3(
    profile(d - spread, width),
    profile(d, width),
    profile(d + spread, width)
  );
  float strength = 0.22 + 1.8 * highlight;
  vec3 color = ring * strength;

  // A soft glow around the highlight, mostly outside the button.
  float glow = exp(-abs(d) / 5.0) * highlight * 0.35;
  glow *= mix(0.4, 1.0, step(0.0, d));

  float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
  if (uDark < 0.5) {
    // On a light page, a white ring does not show: the metal is dark, and
    // only the fringes and the highlight are bright.
    float core = profile(d, 0.7) * (1.0 - highlight);
    color = mix(color, vec3(0.12, 0.13, 0.15), core * 0.7);
    alpha = clamp(alpha + core * 0.45, 0.0, 1.0);
    glow *= 0.5;
  }
  color += vec3(glow);
  alpha = clamp(alpha + glow, 0.0, 1.0);

  gl_FragColor = vec4(min(color, vec3(1.0)), alpha);
}
`

type Renderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  uniforms: Record<
    'canvas' | 'button' | 'time' | 'dark',
    WebGLUniformLocation | null
  >
}

/** undefined: not made yet. null: WebGL is not available. */
let renderer: Renderer | null | undefined
let active: HTMLElement | null = null
let frame = 0
let removeTimer = 0
let started = 0

const transition = (duration: number, ease: ReadonlyArray<number>) =>
  `opacity ${duration * 1000}ms cubic-bezier(${ease.join(', ')})`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  if (import.meta.env.DEV) console.warn(gl.getShaderInfoLog(shader))
  return null
}

function makeRenderer(): Renderer | null {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.dataset.chromeCanvas = ''
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: `-${PAD}px`,
    width: `calc(100% + ${PAD * 2}px)`,
    height: `calc(100% + ${PAD * 2}px)`,
    zIndex: '-1',
    pointerEvents: 'none',
    opacity: '0',
  })
  const gl = canvas.getContext('webgl', { antialias: false })
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

  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const uniforms = {
    canvas: uniform('uCanvas'),
    button: uniform('uButton'),
    time: uniform('uTime'),
    dark: uniform('uDark'),
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    stop()
    canvas.remove()
    renderer = null
    if (active) active.dataset.chrome = 'static'
  })
  return { canvas, gl, uniforms }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function draw(now: number) {
  if (!renderer || !active) return
  const { canvas, gl, uniforms } = renderer
  // The button can leave the page while it is hovered.
  if (!canvas.isConnected) {
    deactivate()
    return
  }
  const width = active.offsetWidth
  const height = active.offsetHeight
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelWidth = Math.max(1, Math.round((width + PAD * 2) * ratio))
  const pixelHeight = Math.max(1, Math.round((height + PAD * 2) * ratio))
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    gl.viewport(0, 0, pixelWidth, pixelHeight)
  }
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
  gl.uniform2f(uniforms.canvas, width + PAD * 2, height + PAD * 2)
  gl.uniform2f(uniforms.button, width, height)
  // With reduced motion: one still frame.
  gl.uniform1f(uniforms.time, reducedMotion() ? 0 : (now - started) / 1000)
  gl.uniform1f(uniforms.dark, dark || active.closest('.scheme-dark') ? 1 : 0)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  if (!reducedMotion()) frame = requestAnimationFrame(draw)
}

function stop() {
  cancelAnimationFrame(frame)
  frame = 0
}

function activate(element: HTMLElement) {
  if (renderer === undefined) renderer = makeRenderer()
  active = element
  if (!renderer) {
    element.dataset.chrome = 'static'
    return
  }
  window.clearTimeout(removeTimer)
  const { canvas } = renderer
  // Not prepend: the Workers types change its signature.
  element.insertBefore(canvas, element.firstChild)
  element.dataset.chrome = 'on'
  canvas.style.transition = transition(DURATIONS.enter, EASE_OUT)
  stop()
  started = started || performance.now()
  // Draw the first frame before the canvas fades in.
  draw(performance.now())
  canvas.style.opacity = '1'
}

function deactivate() {
  const element = active
  active = null
  if (!element) return
  delete element.dataset.chrome
  if (!renderer) return
  const { canvas } = renderer
  canvas.style.transition = transition(DURATIONS.exit, EASE_IN)
  canvas.style.opacity = '0'
  removeTimer = window.setTimeout(() => {
    stop()
    if (!active) canvas.remove()
  }, DURATIONS.exit * 1000)
}

function isDisabled(element: HTMLElement) {
  return (
    element.matches(':disabled, [aria-disabled="true"], [data-disabled]') ||
    element.closest('[inert]') !== null
  )
}

/**
 * Starts the hover effect for the whole page. Returns a function that stops
 * it. Touch screens have no hover, so they get nothing.
 */
export function startChromeHover(): () => void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return () => undefined
  }

  const onOver = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const target = event.target instanceof Element ? event.target : null
    const element = target?.closest<HTMLElement>('.chrome-ring') ?? null
    if (!element || element === active || isDisabled(element)) return
    if (active) deactivate()
    activate(element)
  }
  const onOut = (event: PointerEvent) => {
    if (!active) return
    const next = event.relatedTarget
    if (next instanceof Node && active.contains(next)) return
    deactivate()
  }

  document.addEventListener('pointerover', onOver)
  document.addEventListener('pointerout', onOut)
  return () => {
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
    deactivate()
  }
}
