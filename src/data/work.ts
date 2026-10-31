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
  visual: 'whimcall' | 'pico' | 'postmaster'
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
    title: 'Postmaster',
    category: 'Mac app · Email',
    description:
      'A fast, private, keyboard-first Mac email client for Gmail, Outlook, and any IMAP or JMAP account. No server: mail and credentials stay on the Mac.',
    href: 'https://postmaster.aliabbas.net/',
    image: '/postmaster.webp',
    year: '2026',
    tools: ['Swift', 'AppKit', 'IMAP and JMAP'],
    visual: 'postmaster',
    caseStudy: 'postmaster',
  },
] as const satisfies ReadonlyArray<WorkItem>
