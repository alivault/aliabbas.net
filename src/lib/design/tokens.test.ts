import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { DESIGN_RULES } from './rules'
import {
  COLORS,
  COLOR_ROLES,
  CSS_COLOR_NAMES,
  LAYOUT_TOKENS,
  TEXT_TONES,
} from './tokens'
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
  it('the code uses only the tones on /design', () => {
    const allowed = new Set<string>(
      TEXT_TONES.map((tone) => tone.className).filter((name) =>
        name.includes('/'),
      ),
    )
    const files = readdirSync('src', {
      recursive: true,
      encoding: 'utf8',
    }).filter((file) => /\.tsx?$/.test(file) && !file.endsWith('.test.ts'))
    const wrong = files.flatMap((file) =>
      [
        ...readFileSync(`src/${file}`, 'utf8').matchAll(
          /\btext-foreground\/\d+\b(?!\])/g,
        ),
      ]
        .map((match) => match[0])
        .filter((name) => !allowed.has(name))
        .map((name) => `${file}: ${name}`),
    )
    expect(wrong).toEqual([])
  })
})
