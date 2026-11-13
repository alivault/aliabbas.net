import { describe, expect, it } from 'vite-plus/test'
import { dashTiming } from './dash'

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
