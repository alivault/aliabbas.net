import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from 'cn'

/** Points on the edge of the orb. The shader has the same number. */
const POINTS = 72
/**
 * The orb radius as a part of the canvas width: the canvas is 3 radii from
 * the center to each side, so the orb can jiggle and stretch freely. A drag
 * pulls the edge to at most MAX_PULL radii, and the halo fades out before
 * the border.
 */
const RADIUS = 1 / 6
const MAX_PULL = 2.4
/** The edge never comes nearer to the center than this, in radii. */
const EDGE_FLOOR = 0.3

/** How hard a drag pulls the edge near the pointer, and how it damps it. */
const DRAG_STIFFNESS = 700
const DRAG_DAMPING = 14
/**
 * While pressed, the orb shrinks to this size, on a spring that bounces a
 * little when it lets go.
 */
const PRESSED_SCALE = 0.8
const PRESS_STIFFNESS = 170
const PRESS_DAMPING = 11
/** A press that moves less than this, in CSS pixels, is a click. */
const CLICK_SLOP = 6

/** Keeps a value above a floor: it eases into it, and never passes it. */
function floor(value: number, min: number) {
  const knee = 0.15
  if (value > min + knee) return value
  return min + knee - knee * Math.tanh((min + knee - value) / knee)
}

// The edge is a ring of springs. Each point springs back to the resting
// shape, and pulls on its neighbors, so a poke runs around the edge as a
// ripple. Little damping: it jiggles.
const STIFFNESS = 70
const DAMPING = 4.5
const COUPLING = 900

/** Phase speeds, per second, as in the liquid metal of the buttons. */
const FLOW_SPEED = 0.45
const TWIST_SPEED = 0.3

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

/**
 * A marble of light. Inside a sphere of dark glass, three ribbons of light
 * flow and twist, as in the liquid metal of the buttons (src/lib/
 * liquid-metal.ts): prism fringes, white-hot where a ribbon faces the
 * viewer, and the same roll-off and grain. Each ribbon is at its own depth:
 * the sphere bends it like a lens, and it moves with the pointer by its
 * depth, so the marble has an inside. The colors are those of the chrome
 * ring of the buttons.
 */
const FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uResolution;   // canvas, device pixels
uniform vec2 uCenter;       // orb center, device pixels from the top left
uniform float uRadius;      // device pixels
uniform float uEdge[${POINTS}]; // edge radius at each point, 1 = uRadius
uniform float uFlow;        // phase of the flow
uniform float uTwist;       // phase of the twist
uniform float uEnergy;      // 0 at rest, 1 just after a poke
uniform vec2 uTilt;         // toward the pointer, -1 to 1
uniform vec3 uBase;         // the --chrome token
uniform float uSeed;        // changes each frame, for the grain

const float TAU = 6.28318530718;
const int POINTS = ${POINTS};

// Pairs of tints from the chrome ring of the buttons, one for each depth.
const vec3 WARM[3] = vec3[3](
  vec3(0.988, 0.42, 0.2),   // orange
  vec3(0.984, 0.256, 0.397),// coral
  vec3(1.0, 0.695, 0.279)   // gold
);
const vec3 COOL[3] = vec3[3](
  vec3(0.2, 0.39, 0.916),   // violet blue
  vec3(0.0, 0.792, 1.0),    // cyan
  vec3(0.517, 0.203, 0.959) // purple
);
const float WEIGHT[3] = float[3](1.0, 0.6, 0.38);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// The edge radius at an angle: a Catmull-Rom curve through the points.
float edgeAt(float angle) {
  float x = fract(angle / TAU) * float(POINTS);
  int i = int(floor(x));
  float t = fract(x);
  float p0 = uEdge[(i + POINTS - 1) % POINTS];
  float p1 = uEdge[i % POINTS];
  float p2 = uEdge[(i + 1) % POINTS];
  float p3 = uEdge[(i + 2) % POINTS];
  return p1 + 0.5 * t * (p2 - p0 + t * (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3
    + t * (3.0 * (p1 - p2) + p3 - p0)));
}

// The ribbon at x: its center line, its width, and how much it faces the
// viewer (1) or turns edge-on (0).
vec3 ribbon(float x, float offset) {
  float center = 0.24 * sin(x * 1.9 + uFlow + offset)
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

vec3 shade(vec2 p, float offset, vec3 warm, vec3 cool) {
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
  // The tint moves along the ribbon, from warm to cool.
  vec3 tint = mix(warm, cool,
    smoothstep(-0.6, 0.6, sin(p.x * 1.1 + uFlow * 0.4 + offset)));
  float core = exp(-v * v * 12.0) * pow(r.z, 2.0);
  color *= mix(tint * 1.3, vec3(1.0), core);
  // A soft glow around the ribbon.
  color += cool * exp(-v * v * 0.5) * 0.12;
  return color * light;
}

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 p = (pixel - uCenter) / uRadius;
  float len = length(p);
  float angle = atan(p.y, p.x);
  float edge = edgeAt(angle);
  float cover = smoothstep(edge + 1.5 / uRadius, edge - 1.5 / uRadius, len);

  // A halo of light around the orb.
  float outside = max(len - edge, 0.0) / edge;
  float halo = exp(-outside * 7.0) * (0.25 + 0.35 * uEnergy) * (1.0 - cover);
  // Fade the halo out before the canvas border, so no edge shows.
  vec2 border = min(pixel, uResolution - pixel) / (uRadius * 0.5);
  halo *= clamp(min(border.x, border.y), 0.0, 1.0);
  vec3 haloTint = mix(WARM[0], COOL[0], 0.5 + 0.5 * sin(angle + uFlow * 0.3));
  // Most of the canvas is outside the orb: only the halo shows there, so
  // skip the costly light inside.
  if (cover <= 0.0) {
    fragColor = vec4(haloTint * halo, halo * 0.6);
    return;
  }

  // The point on a unit sphere under this pixel.
  vec2 q = p / edge;
  float z = sqrt(max(1.0 - dot(q, q), 0.0));
  vec3 normal = vec3(q.x, -q.y, z);

  // The glass bends the light inside: the edge magnifies, like a lens.
  vec2 lens = q / (0.55 + 0.45 * z);

  vec3 light = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float depth = float(k);
    vec2 uv = rotate(depth * 2.1 + uFlow * 0.06 * (depth + 1.0)) * lens;
    // A deeper ribbon is smaller and moves more with the pointer.
    uv = uv * (0.8 + 0.3 * depth) + uTilt * (0.1 + 0.14 * depth);
    light += shade(vec2(uv.x * 1.6, uv.y * 0.5), depth * 2.4,
      WARM[k], COOL[k]) * WEIGHT[k];
  }
  light *= 0.75 + uEnergy * 0.8;

  // Light at the rim of the glass, in the colors of the chrome ring.
  float fresnel = pow(1.0 - z, 3.0);
  vec3 rim = mix(COOL[1], vec3(0.693, 0.19, 0.957),
    0.5 + 0.5 * sin(angle * 2.0 + uFlow * 0.5));
  light += rim * fresnel * 0.9;

  // Soft roll-off of the brightest light, as on film.
  vec3 lit = 1.0 - exp(-light * 1.8);
  vec3 color = uBase + lit * (1.0 - uBase);

  // Highlights on the glass.
  float spec = pow(max(dot(normal, normalize(vec3(-0.45, 0.6, 0.65))), 0.0), 48.0);
  spec += 0.18 * pow(max(dot(normal, normalize(vec3(0.5, -0.55, 0.65))), 0.0), 18.0);
  color += spec;

  // Grain, so the smooth gradients show no steps.
  color += (hash(gl_FragCoord.xy + uSeed) - 0.5) * 0.012;
  color = clamp(color, 0.0, 1.0);

  // The dark glass lets a little of the page through. The light does not.
  float glow = max(max(lit.r, lit.g), lit.b);
  float alpha = cover * clamp(0.72 + glow * 0.45 + spec, 0.0, 1.0);

  fragColor = vec4(color * alpha + haloTint * halo, alpha + halo * 0.6);
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

/** The shader on the canvas, or null if the browser has no WebGL 2. */
function makeShader(canvas: HTMLCanvasElement) {
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
  const pokeRef = useRef<(strength: number) => void>(() => undefined)
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

    const offset = new Float32Array(POINTS)
    const velocity = new Float32Array(POINTS)
    const edges = new Float32Array(POINTS)
    const xs = new Float32Array(POINTS)
    const ys = new Float32Array(POINTS)
    const center = { x: 0, y: 0, vx: 0, vy: 0 }
    /** A press on the orb: where the pointer is, and if it moved. */
    const drag = { active: false, moved: false, x: 0, y: 0, fromX: 0, fromY: 0 }
    const tilt = { x: 0, y: 0, toX: 0, toY: 0 }
    /** The size of the whole orb: smaller while pressed. */
    const squeeze = { value: 1, velocity: 0, target: 1 }
    const phase = { time: 0, flow: 0, twist: 0 }
    let energy = 0
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

    /** The edge radius at each point: the morphing shape, plus the jiggle. */
    const updateEdges = () => {
      const time = phase.time
      for (let i = 0; i < POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2
        edges[i] = floor(
          squeeze.value *
            (1 +
              0.045 * Math.sin(2 * angle + time * 0.8) +
              0.03 * Math.sin(3 * angle - time * 1.1 + 1) +
              0.02 * Math.sin(5 * angle + time * 0.6 + 2)) +
            offset[i],
          EDGE_FLOOR,
        )
      }
    }

    const drawShader = (gl: WebGL2RenderingContext, uniforms: Uniforms) => {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
      gl.uniform2f(
        uniforms.uCenter,
        (size / 2 + center.x) * scale,
        (size / 2 + center.y) * scale,
      )
      gl.uniform1f(uniforms.uRadius, size * RADIUS * scale)
      gl.uniform1fv(uniforms.uEdge, edges)
      gl.uniform1f(uniforms.uFlow, phase.flow)
      gl.uniform1f(uniforms.uTwist, phase.twist)
      gl.uniform1f(uniforms.uEnergy, energy)
      gl.uniform2f(uniforms.uTilt, tilt.x, tilt.y)
      gl.uniform3f(uniforms.uBase, base[0] / 255, base[1] / 255, base[2] / 255)
      gl.uniform1f(uniforms.uSeed, (performance.now() % 1000) / 7.3)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    /** Without WebGL 2: a plain glowing blob in the brand color. */
    const drawFlat = (ctx: CanvasRenderingContext2D) => {
      const radius = size * RADIUS
      const cx = size / 2 + center.x
      const cy = size / 2 + center.y
      for (let i = 0; i < POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2
        xs[i] = cx + Math.cos(angle) * radius * edges[i]
        ys[i] = cy + Math.sin(angle) * radius * edges[i]
      }
      const [red, green, blue] = brand
      const color = (alpha: number) => `rgba(${red},${green},${blue},${alpha})`
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.clearRect(0, 0, size, size)
      ctx.beginPath()
      const midX = (i: number) => (xs[i] + xs[(i + 1) % POINTS]) / 2
      const midY = (i: number) => (ys[i] + ys[(i + 1) % POINTS]) / 2
      ctx.moveTo(midX(POINTS - 1), midY(POINTS - 1))
      for (let i = 0; i < POINTS; i++) {
        ctx.quadraticCurveTo(xs[i], ys[i], midX(i), midY(i))
      }
      ctx.closePath()
      const body = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.05,
        cx,
        cy,
        radius * 1.15,
      )
      body.addColorStop(0, `rgba(255,255,255,${0.85 + energy * 0.15})`)
      body.addColorStop(0.3, color(0.95))
      body.addColorStop(1, color(0.45))
      ctx.shadowColor = color(0.9)
      ctx.shadowBlur = radius * (0.45 + energy * 0.5)
      ctx.fillStyle = body
      ctx.fill()
      ctx.shadowBlur = 0
    }

    const draw = () => {
      updateEdges()
      if (shader) drawShader(shader.gl, shader.uniforms)
      else if (context) drawFlat(context)
      glow.style.opacity = String(0.3 + energy * 0.35)
      glow.style.transform = `translate(${center.x}px, ${center.y}px) rotate(${phase.flow * 20}deg) scale(${squeeze.value * (1 + energy * 0.15)})`
    }

    const step = (dt: number) => {
      phase.time += dt
      phase.flow += dt * FLOW_SPEED * (1 + energy * 2)
      phase.twist += dt * TWIST_SPEED * (1 + energy * 1.5)
      for (let i = 0; i < POINTS; i++) {
        const before = offset[(i + POINTS - 1) % POINTS]
        const after = offset[(i + 1) % POINTS]
        const pull = (before + after - 2 * offset[i]) * COUPLING
        velocity[i] +=
          (-STIFFNESS * offset[i] - DAMPING * velocity[i] + pull / POINTS) * dt
      }
      // A drag pulls the edge near the pointer out to the pointer (or in,
      // inside the orb). The rest of the edge follows through its springs.
      if (drag.active && drag.moved) {
        const radius = size * RADIUS
        const reach = Math.hypot(drag.x, drag.y) / radius
        const angle = Math.atan2(drag.y, drag.x)
        for (let i = 0; i < POINTS; i++) {
          const pointAngle = (i / POINTS) * Math.PI * 2
          const apart = Math.atan2(
            Math.sin(pointAngle - angle),
            Math.cos(pointAngle - angle),
          )
          const weight = Math.exp(-((apart / 0.55) ** 2))
          const target = (reach - 1) * weight
          velocity[i] +=
            (DRAG_STIFFNESS * (target - offset[i]) -
              DRAG_DAMPING * velocity[i]) *
            weight *
            dt
        }
        // The whole orb leans a little toward the pointer.
        center.vx += 120 * drag.x * 0.08 * dt
        center.vy += 120 * drag.y * 0.08 * dt
        energy = Math.min(1, energy + dt * 0.8)
      }
      for (let i = 0; i < POINTS; i++) offset[i] += velocity[i] * dt
      // The center bounces on its own spring.
      center.vx += (-120 * center.x - 9 * center.vx) * dt
      center.vy += (-120 * center.y - 9 * center.vy) * dt
      center.x += center.vx * dt
      center.y += center.vy * dt
      // The light inside turns toward the pointer, smoothly.
      const ease = Math.min(1, dt * 5)
      tilt.x += (tilt.toX - tilt.x) * ease
      tilt.y += (tilt.toY - tilt.y) * ease
      energy *= Math.exp(-dt * 1.6)
      squeeze.velocity +=
        (PRESS_STIFFNESS * (squeeze.target - squeeze.value) -
          PRESS_DAMPING * squeeze.velocity) *
        dt
      squeeze.value += squeeze.velocity * dt
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
      const lobes = Math.random() * Math.PI * 2
      for (let i = 0; i < POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2
        velocity[i] -= strength * (1 + 0.35 * Math.sin(3 * angle + lobes))
      }
      center.vy += strength * 60
      energy = Math.min(1, energy + 0.8)
      start()
    }

    pressRef.current = (down: boolean) => {
      if (reduceMotion) return
      squeeze.target = down ? PRESSED_SCALE : 1
      // A small wobble on the way, so the shape morphs as it changes size.
      pokeRef.current(down ? 1 : -1.2)
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
      if (event.button !== 0) return
      button.setPointerCapture(event.pointerId)
      const { x, y } = pointer(event)
      Object.assign(drag, {
        active: true,
        moved: false,
        x,
        y,
        fromX: x,
        fromY: y,
      })
      // The press shrinks the orb, and it stays small while held. It is a
      // poke only if the pointer comes up without a drag.
      press(true, false)
    }
    const onPointerUp = (event: PointerEvent) => {
      if (!drag.active) return
      drag.active = false
      delete button.dataset.stretching
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId)
      }
      if (drag.moved) {
        // Let go: the springs snap the orb back, and it wobbles.
        energy = 1
        start()
      } else {
        // A click: the release lets the orb spring back up.
        press(false, event.type === 'pointerup')
      }
    }

    // Without a press, the surface follows the pointer: a move outward
    // pulls the edge near the pointer out, and a move inward pushes it in.
    let previous: { x: number; y: number } | null = null
    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion) return
      const { x, y } = pointer(event)
      const radius = size * RADIUS
      tilt.toX = Math.max(-1, Math.min(1, x / (radius * 1.6)))
      tilt.toY = Math.max(-1, Math.min(1, y / (radius * 1.6)))
      if (drag.active) {
        if (
          !drag.moved &&
          Math.hypot(x - drag.fromX, y - drag.fromY) > CLICK_SLOP
        ) {
          drag.moved = true
          button.dataset.stretching = ''
          // A stretch pulls the orb out at its full size.
          squeeze.target = 1
        }
        // The pull stops at MAX_PULL radii, so the orb stays on its canvas.
        const reach = Math.hypot(x, y)
        const limit = Math.min(1, (radius * MAX_PULL) / Math.max(reach, 1))
        drag.x = x * limit
        drag.y = y * limit
        previous = null
        return
      }
      if (previous && Math.hypot(x, y) < radius * 1.6) {
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
      previous = { x, y }
    }
    const onPointerLeave = () => {
      previous = null
      if (drag.active) return
      tilt.toX = 0
      tilt.toY = 0
    }

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
      pokeRef.current = () => undefined
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
