/**
 * Caustics on the border of a primary or secondary button, on hover: a 2px
 * band at the edge of the button shows the contour lines of a flowing light
 * field. Each line has a cyan core and a blue glow, with purple, pink and
 * yellow fringes on one side. Nothing shows outside the button.
 *
 * One canvas and one WebGL context serve the whole site. The canvas moves
 * into the button under the pointer and covers it exactly. The loop runs
 * only while a button is hovered. Buttons opt in with the `chrome-ring`
 * class; the CSS, and the fallback without WebGL, are in globals.css.
 */
import { DURATIONS, EASE_IN, EASE_OUT } from '~/lib/design/motion'

/** The width of the CSS border, which the canvas also covers. */
const BORDER = 1
/** The width of the band, in CSS pixels. */
const BAND = 2

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
uniform vec2 uSize;     // button size with its border, CSS pixels
uniform float uTime;
uniform float uPixel;   // one device pixel, in CSS pixels

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p = p * 2.02 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

// Distance to a box with round corners, in pixels. Negative inside.
float roundBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

float bump(float x, float center, float width) {
  float d = (x - center) / width;
  return exp(-d * d);
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  vec2 halfSize = uSize * 0.5;
  float d = roundBox(p, halfSize, min(halfSize.x, halfSize.y));

  // Only the band at the edge, with smooth edges.
  float band = (1.0 - smoothstep(-uPixel, 0.0, d))
    * smoothstep(-${BAND}.0 - uPixel, -${BAND}.0, d);
  if (band <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // The light field: noise, warped twice, so it flows like a liquid.
  float t = uTime * 0.08;
  vec2 q = p / 110.0;
  vec2 warp = vec2(
    fbm(q * 0.8 + vec2(t, -t * 0.7)),
    fbm(q * 0.8 + vec2(3.1 - t * 0.8, 1.7 + t * 0.5))
  );
  float field = fbm(q * 0.7 + warp * 1.2 + vec2(0.0, t * 0.4));

  // Its contour lines. x is 0 on a line and grows to 1 up to the next one.
  float x = fract(field * 4.0);
  vec3 color =
      vec3(1.0, 0.82, 0.2) * bump(x, 0.1, 0.04)     // yellow
    + vec3(1.0, 0.18, 0.45) * bump(x, 0.18, 0.04)   // pink
    + vec3(0.62, 0.3, 1.0) * bump(x, 0.26, 0.05)    // purple
    + vec3(0.55, 0.95, 1.0) * bump(x, 0.38, 0.07)   // cyan core
    // The blue glow fades out before the next line, so the lines join
    // without a hard edge.
    + vec3(0.1, 0.55, 1.0) * smoothstep(0.3, 0.38, x)
      * (1.0 - smoothstep(0.38, 0.97, x));

  // The band is opaque: black where there is no light, as in the reference.
  gl_FragColor = vec4(min(color, vec3(1.0)) * band, band);
}
`

type Renderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  uniforms: Record<'size' | 'time' | 'pixel', WebGLUniformLocation | null>
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
    inset: `-${BORDER}px`,
    width: `calc(100% + ${BORDER * 2}px)`,
    height: `calc(100% + ${BORDER * 2}px)`,
    borderRadius: 'inherit',
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
    size: uniform('uSize'),
    time: uniform('uTime'),
    pixel: uniform('uPixel'),
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
  // offsetWidth includes the border, which the canvas also covers.
  const width = active.offsetWidth
  const height = active.offsetHeight
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelWidth = Math.max(1, Math.round(width * ratio))
  const pixelHeight = Math.max(1, Math.round(height * ratio))
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    gl.viewport(0, 0, pixelWidth, pixelHeight)
  }
  gl.uniform2f(uniforms.size, width, height)
  gl.uniform1f(uniforms.pixel, 1 / ratio)
  // With reduced motion: one still frame.
  gl.uniform1f(uniforms.time, reducedMotion() ? 0 : (now - started) / 1000)
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
