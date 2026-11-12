import { caseStudies } from '~/data/case-studies'
import { heightAt } from './noise'

/** A page of the site, as a sheet that floats in the world. */
export type SheetSpec = {
  id: string
  /** The route that the sheet opens. */
  to: string
  title: string
  /** One or two short lines under the title. */
  summary: string
  /** A short kind label, for the HUD. */
  kind: 'Case study' | 'Page' | 'Game'
  /** A picture for the sheet, from /public. */
  image?: string
  x: number
  z: number
  /** The height of the sheet center. */
  y: number
}

/** Width and height of every sheet, in meters. */
export const SHEET_SIZE = { width: 1.8, height: 2.4 } as const

/** How high a sheet floats over the ground, to its center. */
const FLOAT = 2.1

const IMAGES: Record<string, string> = {
  pico: '/work/pico/workspace-light.webp',
  whimcall: '/work/whimcall/grid.webp',
  postmaster: '/postmaster.webp',
}

const PAGES: Array<Omit<SheetSpec, 'x' | 'y' | 'z'>> = [
  ...caseStudies.map((study) => ({
    id: study.slug,
    to: `/work/${study.slug}`,
    title: study.title,
    summary: study.summary,
    kind: 'Case study' as const,
    image: IMAGES[study.slug],
  })),
  {
    id: 'work',
    to: '/work',
    title: 'Work',
    summary: 'All the projects, with the case studies and side projects.',
    kind: 'Page',
  },
  {
    id: 'experience',
    to: '/experience',
    title: 'Experience',
    summary: 'Where I worked and what I made there.',
    kind: 'Page',
  },
  {
    id: 'skills',
    to: '/skills',
    title: 'Skills',
    summary: 'What I can do, with the evidence for each skill.',
    kind: 'Page',
  },
  {
    id: 'lab',
    to: '/lab',
    title: 'Lab',
    summary: 'Small experiments with motion, shaders and interfaces.',
    kind: 'Page',
  },
  {
    id: 'notes',
    to: '/notes',
    title: 'Notes',
    summary: 'Writing about frontend engineering.',
    kind: 'Page',
  },
  {
    id: 'play',
    to: '/play',
    title: 'Averno',
    summary: 'A game that I made. Play it in the browser.',
    kind: 'Game',
  },
  {
    id: 'chat',
    to: '/chat',
    title: 'Ask about Ali',
    summary: 'An AI that knows my work. Ask it anything.',
    kind: 'Page',
  },
  {
    id: 'performance',
    to: '/performance',
    title: 'Performance',
    summary: 'Core Web Vitals of this site, from real visits.',
    kind: 'Page',
  },
  {
    id: 'design',
    to: '/design',
    title: 'Design system',
    summary: 'The tokens and rules of this site.',
    kind: 'Page',
  },
  {
    id: 'contact',
    to: '/contact',
    title: 'Contact',
    summary: 'Send me a message.',
    kind: 'Page',
  },
]

/**
 * Places the sheets on a loose spiral out from the start. The first two are
 * in the first view, left and right, as in a room you just came into.
 */
export const SHEETS: Array<SheetSpec> = PAGES.map((page, i) => {
  const first = [
    [-2.6, -5],
    [7, -19],
  ][i]
  const angle = i * 2.399963 - 1.2
  const radius = 12 + i * 7
  const x = first ? first[0] : Math.sin(angle) * radius
  const z = first ? first[1] : -Math.cos(angle) * radius
  return { ...page, x, z, y: heightAt(x, z) + FLOAT }
})

/** Paths that open the sheet of another page. */
const ALIASES: Record<string, string> = { '/check': '/chat' }

/**
 * The sheet that a path opens: the sheet of that page, or of the page it is
 * under (a note is in the notes sheet).
 */
export function sheetForPath(path: string): SheetSpec | undefined {
  let clean = path.replace(/\/+$/, '') || '/'
  clean = ALIASES[clean] ?? clean
  const exact = SHEETS.find((sheet) => sheet.to === clean)
  if (exact) return exact
  return SHEETS.filter((sheet) => clean.startsWith(`${sheet.to}/`)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0]
}
