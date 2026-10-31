import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'

// The page is rendered by the layout in _assistant.tsx, which keeps chat and
// the claim checker mounted together.
export const Route = createFileRoute('/_assistant/chat')({
  head: () =>
    pageHead({
      title: 'Ask About Ali — Portfolio AI',
      description:
        "Ask Ali Abbas's portfolio assistant about his experience, selected work, technical skills, and product engineering approach.",
      path: '/chat',
    }),
  component: () => null,
})
