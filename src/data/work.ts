import type { CaseStudySlug } from '~/data/case-studies'

export type WorkItem = {
  title: string
  category: string
  description: string
  href: string
  image?: string
  year: string
  /** Shown on the case study page. */
  tools: Array<string>
  visual: 'whimcall' | 'pico' | 'chromagine'
  /** Slug of the case study at /work/$slug, if there is one. */
  caseStudy?: CaseStudySlug
}

export const recentWork = [
  {
    title: 'Pico',
    category: 'Developer tool · AI agents',
    description:
      'A fast, keyboard-first browser workspace designed around local Pi coding-agent sessions.',
    href: 'https://pico.aliabbas.net/',
    image: '/pico.svg',
    year: '2026',
    tools: ['React', 'Node.js', 'Local-first'],
    visual: 'pico',
    caseStudy: 'pico',
  },
  {
    title: 'Whimcall',
    category: 'Real-time communication',
    description:
      'Fast, browser-based video calls that start with a link—no guest account, download, or setup required.',
    href: 'https://whimcall.com/',
    image: '/whimcall.png',
    year: '2026',
    tools: ['TanStack Start', 'WebRTC', 'Cloudflare'],
    visual: 'whimcall',
    caseStudy: 'whimcall',
  },
  {
    title: 'Chromagine',
    category: 'Creative tool · Color',
    description:
      'A joyful utility for creating harmonious palettes with perceptual color models instead of guesswork.',
    href: 'https://chromagine.aliabbas.net/',
    year: '2025',
    tools: ['React', 'Color science', 'Design'],
    visual: 'chromagine',
  },
] as const satisfies ReadonlyArray<WorkItem>
