import { describe, expect, it } from 'vite-plus/test'
import { nextOnTour } from './tour'

const sheets = [
  { id: 'a', x: 10, z: 0 },
  { id: 'b', x: -10, z: 0 },
  { id: 'c', x: 0, z: 30 },
  { id: 'd', x: 0, z: -60 },
]

/** Press Next `count` times, flying to each sheet it picks. */
function tour(count: number, visited: Array<string> = []) {
  const shown = new Set<string>()
  let here = { x: 0, z: 0 }
  const order: Array<string> = []
  for (let i = 0; i < count; i++) {
    const sheet = nextOnTour(sheets, here, visited, shown)
    order.push(sheet.id)
    // Next stops 5.5 m in front of the sheet.
    here = { x: sheet.x + 5.5, z: sheet.z }
  }
  return order
}

describe('nextOnTour', () => {
  it('shows every sheet once before it shows one again', () => {
    expect(new Set(tour(4)).size).toBe(4)
  })

  it('does not go back and forth between two near sheets', () => {
    const order = tour(8)
    for (let i = 2; i < order.length; i++) {
      expect(order[i] === order[i - 2] && order[i - 1] === order[i - 3]).toBe(
        false,
      )
    }
  })

  it('shows the sheets not opened yet first', () => {
    expect(tour(2, ['a', 'b']).sort()).toEqual(['c', 'd'])
  })

  it('starts a new tour with a sheet other than the last', () => {
    const order = tour(5)
    expect(order[4]).not.toBe(order[3])
  })
})
