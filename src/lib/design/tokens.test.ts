import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { apcaContrast } from './contrast'
import { DESIGN_RULES } from './rules'
import { COLORS, COLOR_ROLES, CSS_COLOR_NAMES, LAYOUT_TOKENS } from './tokens'
import { describe, expect, it } from 'vite-plus/test'

describe('design tokens', () => {
  it('reads the colors from globals.css', () => {
    expect(COLORS.length).toBeGreaterThan(15)
    const background = COLORS.find((color) => color.name === 'background')
    expect(background?.light).toMatch(/^oklch\(/)
    expect(background?.dark).toMatch(/^oklch\(/)
    expect(background?.dark).not.toBe(background?.light)
  })

  it('describes every color in the CSS, and only those', () => {
    expect(Object.keys(COLOR_ROLES).sort()).toEqual([...CSS_COLOR_NAMES].sort())
  })

  it('reads the responsive layout values', () => {
    const padding = LAYOUT_TOKENS.find(
      (token) => token.name === 'section-padding',
    )
    expect([padding?.base, padding?.sm, padding?.lg]).toEqual([
      '3rem',
      '4rem',
      '5rem',
    ])
  })
})

describe('design rules', () => {
  it('have unique ids', () => {
    const ids = DESIGN_RULES.map((rule) => rule.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('name checks that exist', () => {
    const files = DESIGN_RULES.flatMap(
      (rule) => rule.checkedBy?.split(', ') ?? [],
    )
    for (const file of files) expect(existsSync(file), file).toBe(true)
  })
})

describe('text tones', () => {
  it('the code does not lower the opacity of text-foreground', () => {
    const files = readdirSync('src', {
      recursive: true,
      encoding: 'utf8',
    }).filter((file) => /\.tsx?$/.test(file) && !file.endsWith('.test.ts'))
    const wrong = files.flatMap((file) =>
      [
        ...readFileSync(`src/${file}`, 'utf8').matchAll(
          /\btext-foreground\/\d+\b(?!\])/g,
        ),
      ].map((match) => `${file}: ${match[0]}`),
    )
    expect(wrong).toEqual([])
  })

  // APCA Lc targets: body text 75, secondary text 60.
  const TARGETS = [
    ['foreground', 90],
    ['fg-secondary', 75],
    ['fg-muted', 60],
    ['brand', 60],
  ] as const

  for (const scheme of ['light', 'dark'] as const) {
    for (const [name, minimum] of TARGETS) {
      it(`${name} has APCA Lc ${minimum}+ in ${scheme} mode`, () => {
        const color = COLORS.find((token) => token.name === name)
        const background = COLORS.find((token) => token.name === 'background')
        expect(
          apcaContrast(color?.[scheme] ?? '', background?.[scheme] ?? ''),
        ).toBeGreaterThanOrEqual(minimum)
      })
    }

    it(`text on a brand fill has APCA Lc 60+ in ${scheme} mode`, () => {
      const background = COLORS.find((token) => token.name === 'background')
      const brand = COLORS.find((token) => token.name === 'brand')
      // brand-foreground is the page background.
      expect(
        apcaContrast(background?.[scheme] ?? '', brand?.[scheme] ?? ''),
      ).toBeGreaterThanOrEqual(60)
    })
  }
})

describe('apcaContrast', () => {
  it('matches the reference values for black and white', () => {
    // APCA reference: black on white is Lc 106, white on black is Lc 108.
    expect(apcaContrast('oklch(0 0 0)', 'oklch(1 0 0)')).toBe(106)
    expect(apcaContrast('oklch(1 0 0)', 'oklch(0 0 0)')).toBe(108)
  })
})
