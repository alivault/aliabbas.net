/**
 * Liquid metal fill on a primary button, on hover: a black base, and a
 * ribbon of fine strands that flows and twists across the button. Where the
 * ribbon faces the viewer it is white hot; where it turns away it is thin
 * and dim. Each color channel sits a little to the side, so one edge of the
 * ribbon is warm and the other is cool, as light through a prism.
 *
 * One canvas and one WebGL context serve the whole site. The canvas moves
 * into the button under the pointer, covers it, and is clipped to its shape.
 * The loop runs only while a button is hovered. Buttons opt in with the
 * `liquid-metal` class; their styles, and the fallback without WebGL, are
 * in the primary variant in button.tsx.
 */
import { DURATIONS, EASE_IN, EASE_OUT } from '~/lib/design/motion'

/** The width of the CSS border, which the canvas also covers. */
const BORDER = 1
/** The most device pixels the canvas gets, so a deep zoom stays cheap. */
const MAX_PIXELS = 2_000_000
/** Phase speeds, per second: the flow of the ribbon, and its twist. */
const FLOW_SPEED = 0.45
const TWIST_SPEED = 0.3

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
uniform float uFlow;    // phase of the flow
uniform float uTwist;   // phase of the twist
uniform vec3 uBase;     // the --chrome token
uniform float uSeed;    // changes each frame, for the grain

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// The ribbon at x: its center line, its width, and how much it faces the
// viewer (1) or turns edge-on (0).
vec3 ribbon(float x, float offset) {
  float center = 0.5
    + 0.26 * sin(x * 1.9 + uFlow + offset)
    + 0.1 * sin(x * 4.3 - uFlow * 1.4 + offset * 2.0);
  float width = 0.3 + 0.08 * sin(x * 1.3 - uFlow * 0.6 + offset);
  float facing = abs(cos(x * 1.6 - uTwist * 3.0 + offset));
  return vec3(center, width, facing);
}

// One channel of a ribbon: soft across, with fine strands along it.
float strands(float v, float x) {
  float body = exp(-v * v * 3.2);
  float lines = 0.88 + 0.12 * sin(v * 45.0 + sin(x * 3.0) * 4.0);
  return body * lines;
}

vec3 shade(vec2 p, float offset, float strength) {
  vec3 r = ribbon(p.x, offset);
  // Edge-on, the ribbon is thinner: its width shows its twist.
  float width = r.y * (0.2 + 0.8 * r.z);
  float v = (p.y - r.x) / width;
  // Prism: red sits to one side and blue to the other.
  float spread = 0.38;
  vec3 color = vec3(
    strands(v + spread, p.x),
    strands(v, p.x),
    strands(v - spread, p.x)
  );
  // White hot where the ribbon faces the viewer.
  float light = 0.25 + 2.6 * pow(r.z, 3.0);
  // Warm fringes on the left of the button, cool on the right.
  vec3 tint = mix(vec3(1.0, 0.42, 0.12), vec3(0.12, 0.55, 1.0),
    smoothstep(0.15, 0.85, vUv.x));
  float core = exp(-v * v * 12.0) * pow(r.z, 2.0);
  color *= mix(tint * 1.3, vec3(1.0), core);
  // A soft glow around the ribbon.
  color += vec3(0.2, 0.4, 1.0) * exp(-v * v * 0.5) * 0.12;
  return color * light * strength;
}

void main() {
  float aspect = uSize.x / uSize.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);

  vec3 color = shade(p, 0.0, 1.0) + shade(p, 2.4, 0.45);

  // Dim the light a little behind the label, so the label reads on it.
  float label = (1.0 - smoothstep(0.12, 0.4, abs(vUv.y - 0.5)))
    * (1.0 - smoothstep(0.25, 0.45, abs(vUv.x - 0.5)));
  color *= 1.0 - 0.45 * label;

  // Soft roll-off of the brightest light, as on film.
  color = 1.0 - exp(-color * 1.8);
  color = uBase + color * (1.0 - uBase);

  // Grain, so the smooth gradients show no steps.
  color += (hash(gl_FragCoord.xy + uSeed) - 0.5) * 0.012;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`

type Renderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  uniforms: Record<
    'size' | 'flow' | 'twist' | 'base' | 'seed',
    WebGLUniformLocation | null
  >
}

/** undefined: not made yet. null: WebGL is not available. */
let renderer: Renderer | null | undefined
let active: HTMLElement | null = null
let frame = 0
let removeTimer = 0
/** Each motion adds its own speed times the frame time, so it never jumps. */
const phase = { flow: 0, twist: 0, last: 0 }

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

/** The --chrome token as 0–1 RGB, read through a 2D canvas. */
function chromeBase(): [number, number, number] {
  const probe = document.createElement('canvas').getContext('2d')
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--chrome')
    .trim()
  if (!probe || !value) return [0.02, 0.02, 0.03]
  probe.fillStyle = value
  probe.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

function makeRenderer(): Renderer | null {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.dataset.liquidMetal = ''
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
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false })
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
    flow: uniform('uFlow'),
    twist: uniform('uTwist'),
    base: uniform('uBase'),
    seed: uniform('uSeed'),
  }
  gl.uniform3fv(uniforms.base, chromeBase())

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    stop()
    canvas.remove()
    renderer = null
    if (active) active.dataset.liquidMetal = 'static'
  })
  return { canvas, gl, uniforms }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Device pixels per CSS pixel: the screen density times the pinch zoom,
 * which does not change devicePixelRatio. So the fill stays sharp when the
 * page is zoomed in.
 */
function pixelRatio(width: number, height: number) {
  const zoom = window.visualViewport?.scale ?? 1
  const ratio = (window.devicePixelRatio || 1) * Math.max(zoom, 1)
  const limit = Math.sqrt(MAX_PIXELS / Math.max(width * height, 1))
  return Math.min(ratio, limit)
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
  const ratio = pixelRatio(width, height)
  const pixelWidth = Math.max(1, Math.round(width * ratio))
  const pixelHeight = Math.max(1, Math.round(height * ratio))
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
    gl.viewport(0, 0, pixelWidth, pixelHeight)
  }
  // With reduced motion: one still frame.
  if (!reducedMotion()) {
    const seconds = phase.last ? Math.min((now - phase.last) / 1000, 0.05) : 0
    phase.flow += seconds * FLOW_SPEED
    phase.twist += seconds * TWIST_SPEED
  }
  phase.last = now
  gl.uniform2f(uniforms.size, width, height)
  gl.uniform1f(uniforms.flow, phase.flow)
  gl.uniform1f(uniforms.twist, phase.twist)
  gl.uniform1f(uniforms.seed, (now % 1000) / 7.3)
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
    element.dataset.liquidMetal = 'static'
    return
  }
  window.clearTimeout(removeTimer)
  const { canvas } = renderer
  // Not prepend: the Workers types change its signature.
  element.insertBefore(canvas, element.firstChild)
  element.dataset.liquidMetal = 'on'
  canvas.style.transition = transition(DURATIONS.enter, EASE_OUT)
  stop()
  phase.last = 0
  // Draw the first frame before the canvas fades in.
  draw(performance.now())
  canvas.style.opacity = '1'
}

function deactivate() {
  const element = active
  active = null
  if (!element) return
  delete element.dataset.liquidMetal
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
export function startLiquidMetal(): () => void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return () => undefined
  }

  const onOver = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const target = event.target instanceof Element ? event.target : null
    const element = target?.closest<HTMLElement>('.liquid-metal') ?? null
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
  // A still frame (reduced motion) is drawn again when the zoom changes.
  const onZoom = () => {
    if (active && reducedMotion()) draw(performance.now())
  }

  document.addEventListener('pointerover', onOver)
  document.addEventListener('pointerout', onOut)
  window.visualViewport?.addEventListener('resize', onZoom)
  window.addEventListener('resize', onZoom)
  return () => {
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
    window.visualViewport?.removeEventListener('resize', onZoom)
    window.removeEventListener('resize', onZoom)
    deactivate()
  }
}
