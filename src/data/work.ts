export type WorkItem = {
  title: string
  category: string
  description: string
  contribution: string
  href: string
  image?: string
  year: string
  tools: Array<string>
  visual: 'whimcall' | 'pico' | 'chromagine'
}

export const recentWork = [
  {
    title: 'Whimcall',
    category: 'Real-time communication',
    description:
      'Fast, browser-based video calls that start with a link—no guest account, download, or setup required.',
    contribution:
      'Product concept, brand and interface design, full-stack development, realtime media architecture, and deployment.',
    href: 'https://whimcall.com/',
    image: '/whimcall.png',
    year: '2026',
    tools: ['TanStack Start', 'WebRTC', 'Cloudflare'],
    visual: 'whimcall',
  },
  {
    title: 'Pico',
    category: 'Native developer tool',
    description:
      'A fast, keyboard-first browser workspace designed around local Pi coding-agent sessions.',
    contribution:
      'Product concept, interface design, native development, and local-first architecture.',
    href: 'https://github.com/alivault/pico',
    image: '/pico.svg',
    year: '2026',
    tools: ['Swift', 'WebKit', 'Local-first'],
    visual: 'pico',
  },
  {
    title: 'Chromagine',
    category: 'Creative tool · Color',
    description:
      'A joyful utility for creating harmonious palettes with perceptual color models instead of guesswork.',
    contribution:
      'Product design, color systems, React development, and deployment.',
    href: 'https://chromagine.aliabbas.dev/',
    year: '2025',
    tools: ['React', 'Color science', 'Design'],
    visual: 'chromagine',
  },
] as const satisfies ReadonlyArray<WorkItem>
