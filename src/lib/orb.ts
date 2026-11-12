/**
 * The orb: a marble of light with a soft, springy edge. Its look (a GLSL
 * function) and its body (the springs of its edge) are here, so the orb of
 * the chat page and the orb in the world are the same orb. All lengths are
 * in orb radii.
 */

/** Points on the edge of the orb. The shader has the same number. */
export const ORB_POINTS = 72
/** A drag pulls the edge to at most this many radii. */
export const MAX_PULL = 2.4
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

// The edge is a ring of springs. Each point springs back to the resting
// shape, and pulls on its neighbors, so a poke runs around the edge as a
// ripple. Little damping: it jiggles.
const STIFFNESS = 70
const DAMPING = 4.5
const COUPLING = 900

/** Phase speeds, per second, as in the liquid metal of the buttons. */
const FLOW_SPEED = 0.45
const TWIST_SPEED = 0.3

/** Keeps a value above a floor: it eases into it, and never passes it. */
function floor(value: number, min: number) {
  const knee = 0.15
  if (value > min + knee) return value
  return min + knee - knee * Math.tanh((min + knee - value) / knee)
}

/**
 * The body of the orb. Feed it the pointer (in radii from its center) and
 * step it each frame; read `edges`, `center`, `tilt`, `energy` and the
 * phases to draw it.
 */
export class OrbBody {
  readonly offset = new Float32Array(ORB_POINTS)
  readonly velocity = new Float32Array(ORB_POINTS)
  readonly edges = new Float32Array(ORB_POINTS).fill(1)
  /** The center, in radii, on its own spring. */
  readonly center = { x: 0, y: 0, vx: 0, vy: 0 }
  /** A press on the orb: where the pointer is, and if it moved. */
  readonly drag = { active: false, moved: false, x: 0, y: 0 }
  /** The light inside turns toward the pointer: -1 to 1. */
  readonly tilt = { x: 0, y: 0, toX: 0, toY: 0 }
  /** The size of the whole orb: smaller while pressed. */
  readonly squeeze = { value: 1, velocity: 0, target: 1 }
  readonly phase = { time: 0, flow: 0, twist: 0 }
  /** 0 at rest, 1 just after a poke. */
  energy = 0
  private previous: { x: number; y: number } | null = null

  /** Steps the body by dt seconds, in small steps for the stiff springs. */
  advance(dt: number) {
    for (let left = Math.min(dt, 1 / 30); left > 0; left -= 1 / 120) {
      this.step(Math.min(left, 1 / 120))
    }
    this.updateEdges()
  }

  /** The edge radius at each point: the morphing shape, plus the jiggle. */
  updateEdges() {
    const time = this.phase.time
    for (let i = 0; i < ORB_POINTS; i++) {
      const angle = (i / ORB_POINTS) * Math.PI * 2
      this.edges[i] = floor(
        this.squeeze.value *
          (1 +
            0.045 * Math.sin(2 * angle + time * 0.8) +
            0.03 * Math.sin(3 * angle - time * 1.1 + 1) +
            0.02 * Math.sin(5 * angle + time * 0.6 + 2)) +
          this.offset[i],
        EDGE_FLOOR,
      )
    }
  }

  private step(dt: number) {
    const { offset, velocity, center, drag, tilt, squeeze, phase } = this
    phase.time += dt
    phase.flow += dt * FLOW_SPEED * (1 + this.energy * 2)
    phase.twist += dt * TWIST_SPEED * (1 + this.energy * 1.5)
    for (let i = 0; i < ORB_POINTS; i++) {
      const before = offset[(i + ORB_POINTS - 1) % ORB_POINTS]
      const after = offset[(i + 1) % ORB_POINTS]
      const pull = (before + after - 2 * offset[i]) * COUPLING
      velocity[i] +=
        (-STIFFNESS * offset[i] - DAMPING * velocity[i] + pull / ORB_POINTS) *
        dt
    }
    // A drag pulls the edge near the pointer out to the pointer (or in,
    // inside the orb). The rest of the edge follows through its springs.
    if (drag.active && drag.moved) {
      const reach = Math.hypot(drag.x, drag.y)
      const angle = Math.atan2(drag.y, drag.x)
      for (let i = 0; i < ORB_POINTS; i++) {
        const pointAngle = (i / ORB_POINTS) * Math.PI * 2
        const apart = Math.atan2(
          Math.sin(pointAngle - angle),
          Math.cos(pointAngle - angle),
        )
        const weight = Math.exp(-((apart / 0.55) ** 2))
        const target = (reach - 1) * weight
        velocity[i] +=
          (DRAG_STIFFNESS * (target - offset[i]) - DRAG_DAMPING * velocity[i]) *
          weight *
          dt
      }
      // The whole orb leans a little toward the pointer.
      center.vx += 120 * drag.x * 0.08 * dt
      center.vy += 120 * drag.y * 0.08 * dt
      this.energy = Math.min(1, this.energy + dt * 0.8)
    }
    for (let i = 0; i < ORB_POINTS; i++) offset[i] += velocity[i] * dt
    // The center bounces on its own spring.
    center.vx += (-120 * center.x - 9 * center.vx) * dt
    center.vy += (-120 * center.y - 9 * center.vy) * dt
    center.x += center.vx * dt
    center.y += center.vy * dt
    // The light inside turns toward the pointer, smoothly.
    const ease = Math.min(1, dt * 5)
    tilt.x += (tilt.toX - tilt.x) * ease
    tilt.y += (tilt.toY - tilt.y) * ease
    this.energy *= Math.exp(-dt * 1.6)
    squeeze.velocity +=
      (PRESS_STIFFNESS * (squeeze.target - squeeze.value) -
        PRESS_DAMPING * squeeze.velocity) *
      dt
    squeeze.value += squeeze.velocity * dt
  }

  /**
   * A squish of the whole orb (a negative strength pushes it out), then a
   * wobble with a few random lobes.
   */
  poke(strength: number) {
    const lobes = Math.random() * Math.PI * 2
    for (let i = 0; i < ORB_POINTS; i++) {
      const angle = (i / ORB_POINTS) * Math.PI * 2
      this.velocity[i] -= strength * (1 + 0.35 * Math.sin(3 * angle + lobes))
    }
    this.center.vy += strength * 1.1
    this.energy = Math.min(1, this.energy + 0.8)
  }

  /** Press (the orb shrinks and stays small) or let go (it springs back). */
  press(down: boolean) {
    this.squeeze.target = down ? PRESSED_SCALE : 1
    // A small wobble on the way, so the shape morphs as it changes size.
    this.poke(down ? 1 : -1.2)
  }

  /** A press starts at this point. */
  grab(x: number, y: number) {
    Object.assign(this.drag, { active: true, moved: false, x, y })
    this.press(true)
  }

  /** The press became a drag: the orb pulls out at its full size. */
  stretch() {
    this.drag.moved = true
    this.squeeze.target = 1
  }

  /** The press ends. Returns true if it was a click, not a drag. */
  release() {
    const { drag } = this
    if (!drag.active) return false
    drag.active = false
    if (drag.moved) {
      // Let go: the springs snap the orb back, and it wobbles.
      this.energy = 1
      return false
    }
    this.press(false)
    return true
  }

  /**
   * The pointer moved to x, y. Without a press, the surface follows it: a
   * move outward pulls the edge near the pointer out, a move inward pushes
   * it in. With a press, it pulls the edge, to at most MAX_PULL radii.
   */
  hover(x: number, y: number) {
    this.tilt.toX = Math.max(-1, Math.min(1, x / 1.6))
    this.tilt.toY = Math.max(-1, Math.min(1, y / 1.6))
    if (this.drag.active) {
      const reach = Math.hypot(x, y)
      const limit = Math.min(1, MAX_PULL / Math.max(reach, 0.01))
      this.drag.x = x * limit
      this.drag.y = y * limit
      this.previous = null
      return
    }
    const previous = this.previous
    if (previous && Math.hypot(x, y) < 1.6) {
      const angle = Math.atan2(y, x)
      const radial =
        (x - previous.x) * Math.cos(angle) + (y - previous.y) * Math.sin(angle)
      for (let i = 0; i < ORB_POINTS; i++) {
        const pointAngle = (i / ORB_POINTS) * Math.PI * 2
        const apart = Math.abs(
          Math.atan2(
            Math.sin(pointAngle - angle),
            Math.cos(pointAngle - angle),
          ),
        )
        if (apart < 0.7) {
          const weight = Math.cos((apart / 0.7) * (Math.PI / 2)) ** 2
          this.velocity[i] += radial * weight * 9
        }
      }
      this.energy = Math.min(1, this.energy + 0.02)
    }
    this.previous = { x, y }
  }

  /** The pointer left: the light inside turns back to the middle. */
  leave() {
    this.previous = null
    if (this.drag.active) return
    this.tilt.toX = 0
    this.tilt.toY = 0
  }
}

/**
 * The look of the orb, as GLSL. Call `orbColor(p, aa, fade, grain)`:
 * p is the point from the orb center in radii (y down), aa the width of
 * one pixel in radii, fade (0 to 1) fades the halo out near the border of
 * the surface, and grain is a random number for this pixel. It returns a
 * premultiplied color.
 *
 * A marble of light. Inside a sphere of dark glass, three ribbons of light
 * flow and twist, as in the liquid metal of the buttons (src/lib/
 * liquid-metal.ts): prism fringes, white-hot where a ribbon faces the
 * viewer, and the same roll-off and grain. Each ribbon is at its own depth:
 * the sphere bends it like a lens, and it moves with the pointer by its
 * depth, so the marble has an inside. The colors are those of the chrome
 * ring of the buttons.
 */
export const ORB_GLSL = /* glsl */ `
uniform float uEdge[${ORB_POINTS}]; // edge radius at each point, 1 = radius
uniform float uFlow;        // phase of the flow
uniform float uTwist;       // phase of the twist
uniform float uEnergy;      // 0 at rest, 1 just after a poke
uniform vec2 uTilt;         // toward the pointer, -1 to 1
uniform vec3 uBase;         // the --chrome token

const float ORB_TAU = 6.28318530718;
const int ORB_POINTS = ${ORB_POINTS};

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

// The edge radius at an angle: a Catmull-Rom curve through the points.
float edgeAt(float angle) {
  float x = fract(angle / ORB_TAU) * float(ORB_POINTS);
  int i = int(floor(x));
  float t = fract(x);
  float p0 = uEdge[(i + ORB_POINTS - 1) % ORB_POINTS];
  float p1 = uEdge[i % ORB_POINTS];
  float p2 = uEdge[(i + 1) % ORB_POINTS];
  float p3 = uEdge[(i + 2) % ORB_POINTS];
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

vec4 orbColor(vec2 p, float aa, float fade, float grain) {
  float len = length(p);
  float angle = atan(p.y, p.x);
  float edge = edgeAt(angle);
  float cover = smoothstep(edge + aa, edge - aa, len);

  // A halo of light around the orb.
  float outside = max(len - edge, 0.0) / edge;
  float halo = exp(-outside * 7.0) * (0.25 + 0.35 * uEnergy) * (1.0 - cover);
  halo *= fade;
  vec3 haloTint = mix(WARM[0], COOL[0], 0.5 + 0.5 * sin(angle + uFlow * 0.3));
  // Most of the surface is outside the orb: only the halo shows there, so
  // skip the costly light inside.
  if (cover <= 0.0) {
    return vec4(haloTint * halo, halo * 0.6);
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
  color += (grain - 0.5) * 0.012;
  color = clamp(color, 0.0, 1.0);

  // The dark glass lets a little of the page through. The light does not.
  float glow = max(max(lit.r, lit.g), lit.b);
  float alpha = cover * clamp(0.72 + glow * 0.45 + spec, 0.0, 1.0);

  return vec4(color * alpha + haloTint * halo, alpha + halo * 0.6);
}

float orbHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
`
