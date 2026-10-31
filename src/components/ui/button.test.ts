import { describe, expect, it } from 'vite-plus/test'
import { BUTTON_SIZE_ROLES, BUTTON_VARIANT_ROLES, sizeClasses } from './button'

describe('button sizes', () => {
  it('have no text under 14px', () => {
    for (const classes of Object.values(sizeClasses)) {
      expect(classes).not.toMatch(/\btext-(xs|\[)/)
    }
  })

  it('are at least 32px high, so they are easy targets', () => {
    for (const classes of Object.values(sizeClasses)) {
      const step = Number(classes.match(/\b(?:h|size)-(\d+)\b/)?.[1])
      expect(step * 4).toBeGreaterThanOrEqual(32)
    }
  })

  it('each have a role for /design', () => {
    expect(Object.keys(BUTTON_SIZE_ROLES).sort()).toEqual(
      Object.keys(sizeClasses).sort(),
    )
  })
})

describe('button variants', () => {
  it('are the four of the design rules', () => {
    expect(Object.keys(BUTTON_VARIANT_ROLES)).toEqual([
      'primary',
      'secondary',
      'ghost',
      'destructive',
    ])
  })
})
