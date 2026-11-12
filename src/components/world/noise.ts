/**
 * The shape of the world. The terrain, the camera height and the placement
 * of the sheets all read the same functions, so they always agree.
 */

function hash(x: number, z: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function smooth(t: number) {
  return t * t * (3 - 2 * t)
}

/** Value noise, 0 to 1. */
function noise(x: number, z: number): number {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const u = smooth(x - xi)
  const v = smooth(z - zi)
  const a = hash(xi, zi)
  const b = hash(xi + 1, zi)
  const c = hash(xi, zi + 1)
  const d = hash(xi + 1, zi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** Fractal noise, about 0 to 1. */
function fbm(x: number, z: number, octaves: number): number {
  let sum = 0
  let amp = 0.5
  let total = 0
  for (let i = 0; i < octaves; i++) {
    sum += noise(x, z) * amp
    total += amp
    x = x * 2.03 + 17.1
    z = z * 2.03 - 9.7
    amp *= 0.5
  }
  return sum / total
}

/** Ground height in meters at a world position. */
export function heightAt(x: number, z: number): number {
  const hills = fbm(x / 90, z / 90, 5)
  const detail = fbm(x / 9, z / 9, 2)
  // Flatter near the start, so the first view is calm.
  const calm = Math.min(1, 0.35 + Math.hypot(x, z) / 80)
  return ((hills - 0.5) * 22 + (detail - 0.5) * 0.6) * calm
}

/** 0 for bare rock, 1 for the black pools of the ground. */
export function poolAt(x: number, z: number): number {
  const n = fbm(x / 26 + 40, z / 26 - 13, 4)
  return Math.min(1, Math.max(0, (n - 0.53) / 0.03))
}

/** Rock tone, 0 to 1, for small changes of color. */
export function rockAt(x: number, z: number): number {
  return fbm(x / 4, z / 4, 3)
}
