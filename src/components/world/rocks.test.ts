import { describe, expect, it } from 'vite-plus/test'
import { rocksIn } from './rocks'
import { SHEETS } from './sheets'

describe('rocks', () => {
  it('are the same each time for the same ground', () => {
    expect(rocksIn(200, -300, 96)).toEqual(rocksIn(200, -300, 96))
  })

  it('are in the square asked for, and a square has some', () => {
    const rocks = rocksIn(400, 400, 96)
    expect(rocks.length).toBeGreaterThan(5)
    for (const rock of rocks) {
      expect(rock.x).toBeGreaterThanOrEqual(400)
      expect(rock.x).toBeLessThan(496)
      expect(rock.z).toBeGreaterThanOrEqual(400)
      expect(rock.z).toBeLessThan(496)
    }
  })

  it('keep away from the icons and the start', () => {
    const rocks = rocksIn(-480, -480, 960)
    for (const rock of rocks) {
      expect(Math.hypot(rock.x, rock.z - 6)).toBeGreaterThan(8)
      for (const sheet of SHEETS) {
        expect(Math.hypot(rock.x - sheet.x, rock.z - sheet.z)).toBeGreaterThan(
          6,
        )
      }
    }
  })
})
