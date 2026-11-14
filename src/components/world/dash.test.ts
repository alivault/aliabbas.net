import { describe, expect, it } from 'vite-plus/test'
import { dashTiming, standOff } from './dash'

describe('dashTiming', () => {
  it('lasts longer for a longer dash', () => {
    const near = dashTiming(4).duration
    const mid = dashTiming(20).duration
    const far = dashTiming(80).duration
    expect(near).toBeLessThan(mid)
    expect(mid).toBeLessThan(far)
  })

  it('is fastest early: the peak is before the middle', () => {
    for (const distance of [2, 10, 30, 120]) {
      const { peak } = dashTiming(distance)
      expect(peak).toBeGreaterThan(0)
      expect(peak).toBeLessThanOrEqual(0.5)
    }
  })

  it('has a short sound for a short dash, and never none', () => {
    expect(dashTiming(0).duration).toBeGreaterThanOrEqual(0.35)
    expect(dashTiming(3).duration).toBeLessThan(1)
  })
})

describe('standOff', () => {
  const view = {
    size: 5,
    drop: 1.7,
    pitch: -0.06,
    halfHeight: (27.5 * Math.PI) / 180,
    halfWidth: (40 * Math.PI) / 180,
  }
  /** The angles of the corners of a square turned corner first, from d. */
  const corners = (d: number) => {
    const half = (view.size * Math.SQRT2) / 2
    return {
      near: Math.atan(view.drop / (d - half)),
      side: Math.atan(half / d),
    }
  }

  it('shows the whole square, turned corner first', () => {
    const d = standOff(view)
    const { near, side } = corners(d)
    expect(near).toBeLessThan(view.halfHeight - view.pitch)
    expect(side).toBeLessThan(view.halfWidth)
  })

  it('stands back further on a narrow screen and when looking up', () => {
    const d = standOff(view)
    expect(standOff({ ...view, halfWidth: 0.37 })).toBeGreaterThan(d)
    expect(standOff({ ...view, pitch: 0.2 })).toBeGreaterThan(d)
  })

  it('is not so far that the square is small', () => {
    expect(standOff(view)).toBeLessThan(9)
  })
})
