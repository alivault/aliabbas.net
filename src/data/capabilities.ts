/**
 * The skills. Each one links to a page where a visitor can see it work,
 * and the home page and /skills show a small live example next to it
 * (src/components/skills/SkillSpecimens.tsx).
 */
export const capabilities = [
  {
    id: 'streaming',
    number: '01',
    title: 'Streaming state',
    description:
      'I model every state a screen can enter: loading, streaming, interrupted, error and done. Typed state machines keep the interface correct when the network is slow or the user stops halfway.',
    proof: {
      to: '/lab',
      hash: 'streaming-list',
      label: 'Force each state in the Lab',
    },
  },
  {
    id: 'motion',
    number: '02',
    title: 'Motion and interaction',
    description:
      'Spring physics, resizers, drawers and layout transitions that keep their state. Every motion has a keyboard path and respects reduced-motion settings.',
    proof: { to: '/lab', hash: 'fluid-resizer', label: 'Try the interactions' },
  },
  {
    id: 'design-systems',
    number: '03',
    title: 'Design systems',
    description:
      'Tokens, shadcn/ui and Base UI components, and written rules, so designers, engineers and coding agents build inside one system.',
    proof: { to: '/design', hash: 'rules', label: 'Read the design system' },
  },
  {
    id: 'performance',
    number: '04',
    title: 'Performance and accessibility',
    description:
      'Screen-reader announcements, visible focus and Core Web Vitals that I measure on real visits. I measure a screen before I call it fast.',
    proof: {
      to: '/performance',
      hash: undefined,
      label: 'See the measurements',
    },
  },
] as const

export type Capability = (typeof capabilities)[number]
