import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { NotFound } from './components/NotFound'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
  if (!CONVEX_URL) {
    console.error('missing envar VITE_CONVEX_URL')
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL, {
    expectAuth: true,
  })

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        staleTime: 1000 * 60, // 1 minute - prevents immediate refetch on hydration
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: 'intent',
      defaultNotFoundComponent: () => <NotFound />,
      scrollRestoration: true,
      scrollRestorationBehavior: 'instant',
      context: {
        queryClient,
        convexClient: convexQueryClient.convexClient,
        convexQueryClient,
      },
    }),
    queryClient,
  )

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
