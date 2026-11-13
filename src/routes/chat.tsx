import { createFileRoute, redirect } from '@tanstack/react-router'

// The chat moved to /ai. Old links and bookmarks still work.
export const Route = createFileRoute('/chat')({
  beforeLoad: () => {
    throw redirect({ to: '/ai', replace: true, statusCode: 301 })
  },
})
