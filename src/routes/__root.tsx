/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { ConvexReactClient } from 'convex/react'
import type { QueryClient } from '@tanstack/react-query'
import { authClient } from '~/lib/auth-client'
import '../styles/globals.css'

// Get auth information for SSR using available cookies
const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getCookie, getRequest } = await import('@tanstack/react-start/server')
    const { fetchSession, getCookieName } = await import('@convex-dev/better-auth/react-start')
    const { createAuth } = await import('../../convex/auth')
    const { session } = await fetchSession(getRequest())
    const sessionCookieName = getCookieName(createAuth)
    const token = getCookie(sessionCookieName)
    return {
      userId: session?.user.id,
      token,
    }
  } catch {
    // Auth not configured yet, return empty
    return { userId: undefined, token: undefined }
  }
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'darkreader-lock', content: 'true' },
      { title: 'Ali Abbas' },
      { name: 'description', content: 'Designer. Developer. Team player.' },
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
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap',
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    // All queries, mutations and actions made with TanStack Query will be
    // authenticated by an identity token.
    const { userId, token } = await fetchAuth()

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
  const context = useRouteContext({ from: Route.id })
  return (
    <ConvexBetterAuthProvider
      client={context.convexClient}
      authClient={authClient}
    >
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="flex flex-col bg-background font-sans text-foreground antialiased **:focus-visible:outline-none **:focus-visible:ring-2 **:focus-visible:ring-ring">
          <Outlet />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  )
}
