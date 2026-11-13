import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'

// The page is rendered by the layout in _assistant.tsx, which keeps chat and
// the claim checker mounted together.
export const Route = createFileRoute('/_assistant/ai')({
  head: () =>
    pageHead({
      title: 'Ask AI About Ali — Ali Abbas',
      description:
        'Ask the AI on the portfolio of Ali Abbas about his experience, work, technical skills and approach to product engineering.',
      path: '/ai',
    }),
  component: () => null,
})
