import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/article/$slug')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/notes/$slug',
      params: { slug: params.slug },
      replace: true,
      statusCode: 301,
    })
  },
})
