export type WorkItem = {
  title: string
  category: string
  description: string
  contribution: string
  href: string
  image?: string
  year: string
  tools: Array<string>
  visual:
    | 'blackhole'
    | 'superverse'
    | 'impostors'
    | 'whimcall'
    | 'pico'
    | 'chromagine'
}

export const clientWork = [
  {
    title: 'BlackHole',
    category: 'Digital product · Web3',
    description:
      'Turning a dense on-chain ecosystem into a focused product experience that feels clear from the first interaction.',
    contribution:
      'Interface engineering, interaction systems, wallet flows, and responsive implementation.',
    href: 'https://blackhole.xyz/',
    image: '/blackhole.svg',
    year: '2025',
    tools: ['Next.js', 'TypeScript', 'RainbowKit'],
    visual: 'blackhole',
  },
  {
    title: 'SuperVerse',
    category: 'Interactive platform · Gaming',
    description:
      'A cinematic, content-rich home for a gaming ecosystem—built to stay expressive without becoming difficult to operate.',
    contribution:
      'Creative development, motion direction, CMS architecture, and frontend systems.',
    href: 'https://superverse.co/',
    image: '/superverse.svg',
    year: '2024',
    tools: ['Next.js', 'Sanity', 'GSAP'],
    visual: 'superverse',
  },
  {
    title: 'Impostors',
    category: 'Brand experience · Gaming',
    description:
      'A character-led digital world where playful motion and tactile interactions make the brand feel alive on every screen.',
    contribution:
      'Frontend development, responsive behavior, animation, and interaction polish.',
    href: 'https://impostors-3-preview.superfarm.workers.dev/',
    image: '/impostors.svg',
    year: '2023',
    tools: ['React', 'Motion', 'Tailwind CSS'],
    visual: 'impostors',
  },
] as const satisfies ReadonlyArray<WorkItem>

export const personalProjects = [
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

export const allWork = [...clientWork, ...personalProjects]
