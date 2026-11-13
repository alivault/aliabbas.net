import { describe, expect, it } from 'vite-plus/test'
import { FRAME_MAX, frameInset, frameScreenX } from './frame'

describe('frame', () => {
  it('fills a screen up to FRAME_MAX', () => {
    expect(frameInset(1440)).toBe(0)
    expect(frameInset(FRAME_MAX)).toBe(0)
    expect(frameScreenX(1440, 0.71)).toBeCloseTo(0.42)
  })

  it('stays in the middle of an ultrawide screen', () => {
    expect(frameInset(3440)).toBe(760)
    // The right edge of the frame, not of the screen.
    expect(frameScreenX(3440, 1)).toBeCloseTo((2 * 2680) / 3440 - 1)
    expect(frameScreenX(3440, 0.5)).toBeCloseTo(0)
  })
})
