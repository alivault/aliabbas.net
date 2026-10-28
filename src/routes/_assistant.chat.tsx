import { createFileRoute } from '@tanstack/react-router'

// The page is rendered by the layout in _assistant.tsx, which keeps chat and
// the claim checker mounted together.
export const Route = createFileRoute('/_assistant/chat')({
  head: () => ({
    meta: [
      { title: 'Ask About Ali — Portfolio AI' },
      {
        name: 'description',
        content:
          "Ask Ali Abbas's portfolio assistant about his experience, selected work, technical skills, and product engineering approach.",
      },
    ],
  }),
  component: () => null,
})
