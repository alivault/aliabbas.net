import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/articles')({
  beforeLoad: () => {
    throw redirect({ to: '/notes', replace: true, statusCode: 301 })
  },
})
