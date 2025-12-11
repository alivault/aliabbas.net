import { reactStartHandler } from '@convex-dev/better-auth/react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => {
        return reactStartHandler(request)
      },
      POST: ({ request }: { request: Request }) => {
        return reactStartHandler(request)
      },
    },
  },
})
