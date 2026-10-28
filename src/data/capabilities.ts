export const capabilities = [
  {
    number: '01',
    title: 'Streaming state',
    description:
      'I model every state a screen can enter: loading, streaming, interrupted, error and done. Typed state machines keep the interface correct when the network is slow or the user stops halfway.',
  },
  {
    number: '02',
    title: 'Motion and interaction',
    description:
      'Spring physics, resizers, drawers and layout transitions that keep their state. Every motion has a keyboard path and respects reduced-motion settings.',
  },
  {
    number: '03',
    title: 'Design systems',
    description:
      'Tokens, shadcn/ui and Base UI components, and written rules, so designers, engineers and coding agents build inside one system.',
  },
  {
    number: '04',
    title: 'Performance and accessibility',
    description:
      'Screen-reader announcements, visible focus and Core Web Vitals that I measure on real visits. I measure a screen before I call it fast.',
  },
] as const
