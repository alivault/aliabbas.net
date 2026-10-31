/**
 * Liquid chrome on the border of a primary or secondary button, on hover.
 *
 * Nothing is colored directly: the shader shades a surface. The 2px band at
 * the edge of the button is a polished metal tube, so across the band its
 * normal turns from the inner edge to the outer edge. Folds flow along the
 * band and bend that normal. The view reflects off the normal into a silver
 * sky (a ramp from black to white), and a highlight from a light that goes
 * around, a fresnel rim, a small chromatic split and grain finish it.
 * Nothing shows outside the button.
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
/** Phase speeds, per second: the folds flow, and the light goes around. */
const FLOW_SPEED = 0.6
const SWEEP_SPEED = 0.7
/** The most device pixels the canvas gets, so a deep zoom stays cheap. */
const MAX_PIXELS = 2_000_000

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
uniform vec2 uSize;        // button size with its border, CSS pixels
uniform float uPixel;      // one device pixel, in CSS pixels
uniform float uFlow;       // phase of the folds
uniform float uSweep;      // phase of the light
uniform float uSeed;       // changes each frame, for the grain

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// Distance to a box with round corners, in pixels. Negative inside.
float roundBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// The silver sky, from black to white, with smooth steps between stops.
vec3 sky(float t) {
  t = clamp(t, 0.0, 1.0) * 4.0;
  vec3 a = vec3(0.02, 0.02, 0.025);
  vec3 b = vec3(0.1, 0.105, 0.115);
  vec3 c = vec3(0.3, 0.315, 0.335);
  vec3 d = vec3(0.68, 0.7, 0.72);
  vec3 e = vec3(0.98, 0.98, 0.99);
  float f = fract(t);
  f = f * f * (3.0 - 2.0 * f);
  if (t < 1.0) return mix(a, b, f);
  if (t < 2.0) return mix(b, c, f);
  if (t < 3.0) return mix(c, d, f);
  return mix(d, e, t >= 4.0 ? 1.0 : f);
}

// Where a reflected direction lands on the sky. The directional term makes
// the top of the ring bright and the bottom dark; the other term makes every
// steep slope bright, so both sides get highlights.
float skyAt(vec2 direction) {
  float directional = 0.5 + 0.5 * (direction.y * 1.3 + direction.x * 0.45);
  float tilt = clamp(length(direction) * 1.4, 0.0, 1.0);
  return mix(directional, tilt, 0.35);
}

// A fold with a broad lit face and a sharp crease on one side. The fast turn
// of the normal across the crease draws a bright seam.
float fold(float f) {
  return sin(f + 0.75 * sin(f));
}

// The height of the flowing folds. Slow noise bends them, so they are not
// straight stripes, and the phase moves them along the border.
float height(vec2 p) {
  vec2 q = p / 48.0;
  float bend = noise(q * 0.9 + vec2(uFlow * 0.15, 0.0)) * 3.0
    + noise(q * 2.1 - vec2(0.0, uFlow * 0.1)) * 1.2;
  return fold(q.x * 2.4 + q.y * 1.3 + bend * 2.6 - uFlow);
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  vec2 halfSize = uSize * 0.5;
  float radius = min(halfSize.x, halfSize.y);
  float d = roundBox(p, halfSize, radius);

  // Only the band at the edge, with smooth edges.
  float band = (1.0 - smoothstep(-uPixel, 0.0, d))
    * smoothstep(-${BAND}.0 - uPixel, -${BAND}.0, d);
  if (band <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // The tube: across the band, s goes from -1 (inner edge) to 1 (outer
  // edge), and the normal leans along the outward direction.
  vec2 outward = normalize(vec2(
    roundBox(p + vec2(0.5, 0.0), halfSize, radius)
      - roundBox(p - vec2(0.5, 0.0), halfSize, radius),
    roundBox(p + vec2(0.0, 0.5), halfSize, radius)
      - roundBox(p - vec2(0.0, 0.5), halfSize, radius)
  ) + 1e-5);
  float s = clamp((d + ${BAND / 2}.0) / ${BAND / 2}.0, -1.0, 1.0) * 0.92;
  vec3 n = vec3(outward * s, sqrt(1.0 - s * s));

  // The folds bend the normal: slope of the height, by finite differences.
  float e = uPixel;
  float h = height(p);
  vec2 slope = vec2(height(p + vec2(e, 0.0)) - h, height(p + vec2(0.0, e)) - h) / e;
  n = normalize(n + vec3(-slope * 9.0, 0.0));

  // Reflect the view into the sky. Each channel reads it at a slightly
  // different spread: a thin prism edge on the brightest turns.
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 color = vec3(
    sky(skyAt(r.xy * 1.04)).r,
    sky(skyAt(r.xy)).g,
    sky(skyAt(r.xy * 0.96)).b
  );

  // A sharp highlight from a light that goes around the button.
  float angle = 2.35619 + uSweep;
  vec3 light = normalize(vec3(cos(angle), sin(angle), 0.65));
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  color += pow(max(dot(n, halfway), 0.0), 90.0) * 0.8;

  // Fresnel: the steep walls of the tube and the folds catch a rim light.
  color += pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0) * 0.18;

  // Grain, so the smooth gradients show no steps.
  color += (hash(gl_FragCoord.xy + uSeed) - 0.5) * 0.012;

  // Premultiplied: the band edges blend into the page.
  gl_FragColor = vec4(clamp(color, 0.0, 1.0) * band, band);
}
`

type Renderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  uniforms: Record<
    'size' | 'pixel' | 'flow' | 'sweep' | 'seed',
    WebGLUniformLocation | null
  >
}

/** undefined: not made yet. null: WebGL is not available. */
let renderer: Renderer | null | undefined
let active: HTMLElement | null = null
let frame = 0
let removeTimer = 0
/** Each motion adds its own speed times the frame time, so it never jumps. */
const phase = { flow: 0, sweep: 0, last: 0 }

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
    pixel: uniform('uPixel'),
    flow: uniform('uFlow'),
    sweep: uniform('uSweep'),
    seed: uniform('uSeed'),
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

/**
 * Device pixels per CSS pixel: the screen density times the pinch zoom,
 * which does not change devicePixelRatio. So the ring stays sharp when the
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
  gl.uniform2f(uniforms.size, width, height)
  gl.uniform1f(uniforms.pixel, 1 / ratio)
  // With reduced motion: one still frame.
  if (!reducedMotion()) {
    const seconds = phase.last ? Math.min((now - phase.last) / 1000, 0.05) : 0
    phase.flow += seconds * FLOW_SPEED
    phase.sweep += seconds * SWEEP_SPEED
  }
  phase.last = now
  gl.uniform1f(uniforms.flow, phase.flow)
  gl.uniform1f(uniforms.sweep, phase.sweep)
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
  phase.last = 0
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
