import { describe, expect, it } from 'vite-plus/test'
import { SUN_DIRECTION } from './sky'
import { opennessAt, sunlightAt } from './terrainLight'

/** A grid of points over the hills, away from the calm start. */
const points = Array.from({ length: 900 }, (_, i) => ({
  x: 150 + (i % 30) * 7,
  z: -200 + Math.floor(i / 30) * 7,
}))

describe('terrain light', () => {
  it('uses the sun of the sky', () => {
    const sun = SUN_DIRECTION.clone()
    // terrainLight.ts has the same direction, written out.
    const flat = Math.hypot(-1, -0.35)
    expect(sun.y / Math.hypot(sun.x, sun.z)).toBeCloseTo(0.18 / flat, 5)
    expect(Math.atan2(sun.z, sun.x)).toBeCloseTo(Math.atan2(-0.35, -1), 5)
  })

  it('gives sunlight from 0 to 1, with some ground in shadow', () => {
    const light = points.map((p) => sunlightAt(p.x, p.z))
    for (const value of light) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
    const shaded = light.filter((value) => value < 0.5).length
    expect(shaded).toBeGreaterThan(points.length * 0.05)
    expect(shaded).toBeLessThan(points.length * 0.8)
  })

  it('gives openness from 0.4 to 1, darker in some hollows', () => {
    const open = points.map((p) => opennessAt(p.x, p.z))
    for (const value of open) {
      expect(value).toBeGreaterThanOrEqual(0.4)
      expect(value).toBeLessThanOrEqual(1)
    }
    expect(Math.min(...open)).toBeLessThan(0.9)
    expect(Math.max(...open)).toBe(1)
  })
})
