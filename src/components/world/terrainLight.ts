import { heightAt } from './noise'

/**
 * The light of the ground that does not change: how much of the low sun
 * reaches each point (hills throw long shadows), and how open each point
 * is (hollows and creases are darker). Both come from the height function
 * when a tile of ground is built, so they cost nothing to draw.
 */

/** Toward the sun: the same direction as SUN_DIRECTION in sky.ts. */
const SUN = { x: -1, y: 0.18, z: -0.35 }
const SUN_FLAT = Math.hypot(SUN.x, SUN.z)
/** Across the ground toward the sun, per meter. */
const SUN_X = SUN.x / SUN_FLAT
const SUN_Z = SUN.z / SUN_FLAT
/** How far up the ray to the sun climbs, per meter across. */
const SUN_RISE = SUN.y / SUN_FLAT

/** How far a hill can throw a shadow, in meters. */
const REACH = 160
/**
 * How soft the edge of a shadow is: wider far from the hill. The sun has
 * set, and the light is the glow of the sky over where it went down, so
 * the shadows are soft.
 */
const SOFT = 0.1

/**
 * 1 where the sun reaches a point, 0 in the shadow of a hill, soft at
 * the edge. It walks toward the sun in steps that grow, and finds how
 * close the ray comes to the ground on the way.
 */
export function sunlightAt(x: number, z: number): number {
  const start = heightAt(x, z) + 0.3
  let closest = 1
  for (let t = 1; t < REACH; t *= 1.18) {
    const ground = heightAt(x + SUN_X * t, z + SUN_Z * t)
    const ray = start + t * SUN_RISE
    closest = Math.min(closest, (ray - ground) / (t * SOFT))
    if (closest < -1) break
  }
  return Math.min(1, Math.max(0, 0.5 + closest * 0.5))
}

/** The rings of points around a point that tell if it is in a hollow. */
const RINGS = [3, 9]
const AROUND = 8

/**
 * 1 on open ground and ridges, less in hollows: the mean rise of the
 * ground around a point, at two distances, turned into shade.
 */
export function opennessAt(x: number, z: number): number {
  const here = heightAt(x, z)
  let rise = 0
  for (const radius of RINGS) {
    for (let i = 0; i < AROUND; i++) {
      const angle = (i / AROUND) * Math.PI * 2
      const around = heightAt(
        x + Math.cos(angle) * radius,
        z + Math.sin(angle) * radius,
      )
      // Ground higher around closes the sky; lower ground does not open
      // it more than flat ground does.
      rise += Math.max(0, around - here) / radius
    }
  }
  rise /= RINGS.length * AROUND
  return Math.min(1, Math.max(0.4, 1 - rise * 1.6))
}
