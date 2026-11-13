import {
  Briefcase,
  FlaskConical,
  Gauge,
  Layers,
  Mail,
  NotebookPen,
  Palette,
  ShieldCheck,
  Brain,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { caseStudies } from '~/data/case-studies'
import { heightAt } from './noise'

/** What a sheet shows: the icon of a project, or a glyph for a page. */
export type SheetIcon =
  | {
      type: 'image'
      src: string
      /** Fill the square, no transparency. */ cover?: boolean
    }
  | { type: 'glyph'; glyph: LucideIcon }
  /** The orb of the chat: a 3D marble of light, not a flat icon. */
  | { type: 'orb' }

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
  icon: SheetIcon
  /**
   * The page uses the full width. The camera puts the icon small, in the
   * square before the page title (iconSlot.ts), not beside the text.
   */
  wide?: boolean
  x: number
  z: number
  /** The height of the sheet center. */
  y: number
}

/** The side of every icon, in meters. */
export const ICON_SIZE = 1.4

/** How high an icon floats over the ground, to its center. */
const FLOAT = 1.9

const ICONS: Record<string, SheetIcon> = {
  pico: { type: 'image', src: '/pico.svg' },
  whimcall: { type: 'image', src: '/whimcall.png' },
  postmaster: { type: 'image', src: '/postmaster.webp' },
}

const PAGES: Array<Omit<SheetSpec, 'x' | 'y' | 'z'>> = [
  ...caseStudies.map((study) => ({
    id: study.slug,
    to: `/work/${study.slug}`,
    title: study.title,
    summary: study.summary,
    kind: 'Case study' as const,
    icon: ICONS[study.slug],
  })),
  {
    id: 'work',
    icon: { type: 'glyph', glyph: Layers },
    to: '/work',
    title: 'Work',
    summary: 'All the projects, with the case studies and side projects.',
    kind: 'Page',
  },
  {
    id: 'experience',
    icon: { type: 'glyph', glyph: Briefcase },
    to: '/experience',
    title: 'Experience',
    summary: 'Where I worked and what I made there.',
    kind: 'Page',
  },
  {
    id: 'skills',
    icon: { type: 'glyph', glyph: Brain },
    to: '/skills',
    title: 'Skills',
    summary: 'What I can do, with the evidence for each skill.',
    kind: 'Page',
  },
  {
    id: 'lab',
    wide: true,
    icon: { type: 'glyph', glyph: FlaskConical },
    to: '/lab',
    title: 'Lab',
    summary: 'Small experiments with motion, shaders and interfaces.',
    kind: 'Page',
  },
  {
    id: 'notes',
    icon: { type: 'glyph', glyph: NotebookPen },
    to: '/notes',
    title: 'Notes',
    summary: 'Writing about frontend engineering.',
    kind: 'Page',
  },
  {
    id: 'play',
    icon: {
      type: 'image',
      src: '/play/averno-crucible-core.webp',
      cover: true,
    },
    to: '/play',
    title: 'Averno',
    summary: 'A game that I made. Play it in the browser.',
    kind: 'Game',
  },
  {
    id: 'chat',
    icon: { type: 'orb' },
    to: '/ai',
    title: 'Ask AI',
    summary: 'An AI that knows my work. Ask it anything.',
    kind: 'Page',
  },
  {
    id: 'performance',
    icon: { type: 'glyph', glyph: Gauge },
    to: '/performance',
    title: 'Performance',
    summary: 'Core Web Vitals of this site, from real visits.',
    kind: 'Page',
  },
  {
    id: 'design',
    icon: { type: 'glyph', glyph: Palette },
    to: '/design',
    title: 'Design system',
    summary: 'The tokens and rules of this site.',
    kind: 'Page',
  },
  {
    id: 'contact',
    icon: { type: 'glyph', glyph: Mail },
    to: '/contact',
    title: 'Contact',
    summary: 'Send me a message.',
    kind: 'Page',
  },
  {
    id: 'privacy',
    icon: { type: 'glyph', glyph: ShieldCheck },
    to: '/privacy',
    title: 'Privacy',
    summary: 'What this site collects, and why.',
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
const ALIASES: Record<string, string> = { '/check': '/ai' }

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
