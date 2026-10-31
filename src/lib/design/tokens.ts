import css from '~/styles/globals.css?raw'
import { DURATIONS, EASE_IN, EASE_OUT, SPRINGS } from './motion'

/**
 * The design tokens, read from `globals.css` at build time. The CSS is the
 * source. This module adds what each token is for, so the /design page and
 * /design/tokens.json can never show a value that the site does not use.
 */

type Declarations = Record<string, string>

/** Custom properties declared directly in the first block that `opener` starts. */
function declarationsIn(source: string, opener: RegExp): Declarations {
  const match = opener.exec(source)
  if (!match) return {}
  let depth = 1
  let index = match.index + match[0].length
  const start = index
  while (depth > 0 && index < source.length) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    index += 1
  }
  const body = source.slice(start, index - 1).replace(/\/\*[\s\S]*?\*\//g, '')
  const result: Declarations = {}
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    result[name] = value.trim().replace(/\s+/g, ' ')
  }
  return result
}

const light = declarationsIn(css, /^:root\s*\{/m)
const dark = declarationsIn(
  css,
  /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{/,
)
const small = declarationsIn(css, /@media \(width >= 40rem\)\s*\{\s*:root\s*\{/)
const large = declarationsIn(css, /@media \(width >= 64rem\)\s*\{\s*:root\s*\{/)

/** The .scheme-dark color scope, for the unit test. */
export const SCHEME_DARK = declarationsIn(css, /^\.scheme-dark\s*\{/m)

export type ColorGroup = 'Surface' | 'Text' | 'Action' | 'Line' | 'Status'

/** What each color is for. A unit test keeps this list equal to the CSS. */
export const COLOR_ROLES: Record<string, { group: ColorGroup; use: string }> = {
  background: { group: 'Surface', use: 'The page.' },
  card: { group: 'Surface', use: 'Cards and panels that sit on the page.' },
  popover: { group: 'Surface', use: 'Hover cards, menus and drawers.' },
  secondary: { group: 'Surface', use: 'Quiet filled controls.' },
  muted: { group: 'Surface', use: 'Wells and hover fills.' },
  'page-base': {
    group: 'Surface',
    use: 'Behind the page cards during a page transition.',
  },
  foreground: {
    group: 'Text',
    use: 'All text. Lower its opacity for less important text.',
  },
  'card-foreground': { group: 'Text', use: 'Text on a card.' },
  'popover-foreground': { group: 'Text', use: 'Text on a popover.' },
  'secondary-foreground': { group: 'Text', use: 'Text on a secondary fill.' },
  'muted-foreground': { group: 'Text', use: 'Text on a muted fill.' },
  'fg-secondary': {
    group: 'Text',
    use: 'Supporting text next to primary text. APCA Lc 75 or more.',
  },
  'fg-muted': {
    group: 'Text',
    use: 'Descriptions, metadata and hints. APCA Lc 60 or more.',
  },
  'fg-faint': {
    group: 'Text',
    use: 'Disabled text and decoration only.',
  },
  primary: { group: 'Action', use: 'The main button of a view.' },
  'primary-foreground': { group: 'Action', use: 'Text on a primary fill.' },
  brand: {
    group: 'Action',
    use: 'Selection, the active citation and the changing word of the homepage hero. Not for titles.',
  },
  'brand-foreground': { group: 'Action', use: 'Text on a brand fill.' },
  accent: { group: 'Action', use: 'Hover fill of menu items.' },
  'accent-foreground': { group: 'Action', use: 'Text on an accent fill.' },
  ring: { group: 'Action', use: 'The focus ring. Every control shows it.' },
  border: { group: 'Line', use: 'Dividers and card edges.' },
  input: { group: 'Line', use: 'Edges of fields.' },
  destructive: { group: 'Status', use: 'Errors and actions that delete.' },
  verified: { group: 'Status', use: 'The claim checker: verified.' },
  partial: { group: 'Status', use: 'The claim checker: partly verified.' },
  contradicted: { group: 'Status', use: 'The claim checker: contradicted.' },
}

export type ColorToken = {
  name: string
  group: ColorGroup
  use: string
  light: string
  /** The dark value. The same as light when dark mode does not change it. */
  dark: string
  /** The Tailwind name, for example `bg-background` or `text-verified`. */
  tailwind: string
}

const LAYOUT = new Set([
  'radius',
  'section-padding',
  'section-content-gap',
  'header-height',
])

/** Every color custom property in `:root`, in CSS order. */
export const CSS_COLOR_NAMES = Object.keys(light).filter(
  (name) => !LAYOUT.has(name),
)

export const COLORS: Array<ColorToken> = CSS_COLOR_NAMES.flatMap((name) => {
  const role = COLOR_ROLES[name]
  if (!role) return []
  const prefix =
    role.group === 'Text' || name.endsWith('-foreground')
      ? 'text'
      : role.group === 'Line'
        ? 'border'
        : 'bg'
  return [
    {
      name,
      ...role,
      light: light[name],
      dark: dark[name] ?? light[name],
      tailwind: `${prefix}-${name}`,
    },
  ]
})

/**
 * All color custom properties of one scheme, as an inline style. A swatch
 * sets them, so a value such as `color-mix(var(--foreground) ...)` resolves
 * in that scheme, not in the scheme of the page.
 */
export const SCHEME_STYLES = {
  light: Object.fromEntries(
    COLORS.map((color) => [`--${color.name}`, color.light]),
  ),
  dark: Object.fromEntries(
    COLORS.map((color) => [`--${color.name}`, color.dark]),
  ),
} as const

/** Text tones: the foreground at lower opacity. */
export const TEXT_TONES = [
  {
    name: 'Primary',
    className: 'text-foreground',
    use: 'Headings and body text.',
  },
  {
    name: 'Secondary',
    className: 'text-fg-secondary',
    use: 'Supporting text next to primary text.',
  },
  {
    name: 'Muted',
    className: 'text-fg-muted',
    use: 'Descriptions, metadata and hints.',
  },
  {
    name: 'Faint',
    className: 'text-fg-faint',
    use: 'Disabled text and decoration. Never for text that people must read.',
  },
] as const

/** The `Title` variants, from `src/components/Title.tsx`. */
export const TYPE_SCALE = [
  {
    variant: 'page',
    role: 'Page title (h1)',
    size: '36–48px',
    lineHeight: 1,
  },
  {
    variant: 'section',
    role: 'Section title',
    size: '32–56px',
    lineHeight: 1.15,
  },
  {
    variant: 'card',
    role: 'Card and project title',
    size: '24–32px',
    lineHeight: 1.2,
  },
  {
    variant: 'subsection',
    role: 'Subsection title',
    size: '20–24px',
    lineHeight: 1.3,
  },
  { variant: 'detail', role: 'Detail title', size: '18px', lineHeight: 1.4 },
] as const

export const BODY_SCALE = [
  {
    className: 'text-lg',
    size: '18px',
    lineHeight: '32px',
    use: 'Lead paragraphs.',
  },
  {
    className: 'text-base',
    size: '16px',
    lineHeight: '28px',
    use: 'Body text.',
  },
  {
    className: 'text-sm',
    size: '14px',
    lineHeight: '24px',
    use: 'Controls, metadata and hints. The smallest size.',
  },
] as const

export const FONTS = {
  sans: { family: 'DM Sans Variable', use: 'All text. Weight 400 for titles.' },
  mono: {
    family: 'JetBrains Mono',
    use: 'Code, file paths and ids only. Never for labels.',
  },
} as const

export const LAYOUT_TOKENS = [
  {
    name: 'header-height',
    use: 'The fixed site header. Offsets under it use it (h-header, top-header).',
    base: light['header-height'],
    sm: light['header-height'],
    lg: light['header-height'],
  },
  {
    name: 'section-padding',
    use: 'Space above and below a page section.',
    base: light['section-padding'],
    sm: small['section-padding'],
    lg: large['section-padding'],
  },
  {
    name: 'section-content-gap',
    use: 'Space between a section title and its content.',
    base: light['section-content-gap'],
    sm: small['section-content-gap'],
    lg: large['section-content-gap'],
  },
  {
    name: 'radius',
    use: 'Corner radius of controls. Cards use radius + 4px, pills use full.',
    base: light.radius,
    sm: undefined,
    lg: undefined,
  },
] as const

export const MOTION = {
  springs: SPRINGS,
  easeOut: EASE_OUT,
  easeIn: EASE_IN,
  durations: DURATIONS,
} as const

const REPO = 'https://github.com/alivault/aliabbas.net/blob/master'

/** Everything above as one JSON document, for coding agents and tools. */
export function designTokensDocument(rules: ReadonlyArray<unknown>) {
  return {
    name: 'aliabbas.net design tokens',
    description:
      'Read from the CSS and the code of the site. Use the Tailwind names in components. Follow the rules.',
    page: 'https://aliabbas.net/design',
    sources: {
      css: `${REPO}/src/styles/globals.css`,
      motion: `${REPO}/src/lib/design/motion.ts`,
      titles: `${REPO}/src/components/Title.tsx`,
      rules: `${REPO}/src/lib/design/rules.ts`,
      agents: `${REPO}/AGENTS.md`,
    },
    colorSchemes: {
      light: 'Default.',
      dark: 'From prefers-color-scheme: dark. There is no manual switch.',
    },
    color: Object.fromEntries(
      COLORS.map(({ name, ...token }) => [name, token]),
    ),
    text: {
      fonts: FONTS,
      minimumSize: '14px',
      tones: TEXT_TONES,
      titles: TYPE_SCALE,
      body: BODY_SCALE,
    },
    layout: {
      breakpoints: { sm: '40rem', lg: '64rem' },
      tokens: LAYOUT_TOKENS,
    },
    motion: MOTION,
    rules,
  }
}
