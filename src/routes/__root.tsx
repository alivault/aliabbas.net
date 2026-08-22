/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import type { AuthClient } from '@convex-dev/better-auth/react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { ConvexReactClient } from 'convex/react'
import Devtools from '~/components/Devtools'
import { sessionQueryOptions } from '~/lib/auth'
import { authClient } from '~/lib/auth-client'
import '../styles/globals.css'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { name: 'darkreader-lock', content: 'true' },
      {
        name: 'theme-color',
        content: '#f1efe8',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'theme-color',
        content: '#10100f',
        media: '(prefers-color-scheme: dark)',
      },
      { title: 'Ali Abbas' },
      {
        name: 'description',
        content:
          'Full-stack product engineer with a strong frontend design background.',
      },
    ],
    links: [
      { rel: 'icon', href: '/icon.png' },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Gloock&family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    // Use ensureQueryData to cache auth - prevents refetch on every navigation
    const { userId, token } =
      await ctx.context.queryClient.ensureQueryData(sessionQueryOptions)

    // During SSR only (the only time serverHttpClient exists),
    // set the auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    return { userId, token }
  },
  component: RootComponent,
})

function RootComponent() {
  const { convexQueryClient, token } = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground flex min-h-svh flex-col font-sans antialiased">
        <ConvexBetterAuthProvider
          client={convexQueryClient.convexClient}
          authClient={authClient as unknown as AuthClient}
          initialToken={token}
        >
          <Outlet />
          <Devtools />
        </ConvexBetterAuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
