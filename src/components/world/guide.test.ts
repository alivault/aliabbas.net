import { describe, expect, it } from 'vite-plus/test'
import { guideArrows, isLost } from './guide'
import type { GuideTarget } from './guide'

const target = (
  id: string,
  distance: number,
  viewX: number,
  viewZ: number,
  onScreen = false,
): GuideTarget => ({ id, title: id, distance, viewX, viewZ, onScreen })

describe('guideArrows', () => {
  it('shows no arrow while an icon is in sight', () => {
    expect(guideArrows([target('a', 20, 0, -20, true)])).toEqual([])
  })

  it('points to the nearest icons when none is in sight', () => {
    const arrows = guideArrows([
      target('far', 90, 0, -90),
      target('right', 30, 30, 0),
      target('behind', 50, 0, 50),
      target('left', 70, -70, 0),
    ])
    expect(arrows.map((arrow) => arrow.id)).toEqual(['right', 'behind', 'left'])
    expect(arrows[0]?.angle).toBeCloseTo(Math.PI / 2)
    expect(Math.abs(arrows[1]?.angle ?? 0)).toBeCloseTo(Math.PI)
    expect(arrows[0]?.strength).toBe(1)
  })

  it('counts an icon in the fog as not seen', () => {
    expect(guideArrows([target('a', 80, 0, -80, true)])).toHaveLength(1)
  })
})

describe('isLost', () => {
  it('is true only when every icon is far', () => {
    expect(isLost([target('a', 50, 0, 0), target('b', 41, 0, 0)])).toBe(true)
    expect(isLost([target('a', 50, 0, 0), target('b', 20, 0, 0)])).toBe(false)
  })
})
