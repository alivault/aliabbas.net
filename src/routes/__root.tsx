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
import LiquidMetalHover from '~/components/LiquidMetalHover'
import VitalsReporter from '~/components/VitalsReporter'
import WorldShell from '~/components/world/WorldShell'
import { ChatSessionProvider } from '~/components/chat/ChatSessionProvider'
import { sessionQueryOptions } from '~/lib/auth'
import { authClient } from '~/lib/auth-client'
import { siteSocialMeta } from '~/lib/structured-data'
import '../styles/globals.css'
import { MotionConfig } from 'motion/react'

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
      { name: 'theme-color', content: '#050607' },
      { title: 'Ali Abbas' },
      {
        name: 'description',
        content:
          'Senior frontend engineer for interactive and streaming interfaces: state machines, motion, design systems, performance and accessibility.',
      },
      ...siteSocialMeta,
    ],
    links: [{ rel: 'icon', href: '/icon.png' }],
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

  // The site is dark only: .scheme-dark gives every token its dark value.
  return (
    <html lang="en" className="scheme-dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground flex min-h-svh flex-col font-sans antialiased">
        <ConvexBetterAuthProvider
          client={convexQueryClient.convexClient}
          authClient={authClient as unknown as AuthClient}
          initialToken={token}
        >
          {/* Motion follows the OS setting for reduced motion on every page. */}
          <MotionConfig reducedMotion="user">
            <ChatSessionProvider>
              <WorldShell>
                <Outlet />
              </WorldShell>
            </ChatSessionProvider>
          </MotionConfig>
          <VitalsReporter />
          <LiquidMetalHover />
          <Devtools />
        </ConvexBetterAuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
