import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

// Get auth information for SSR using available cookies
export const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getCookie, getRequest } = await import(
      '@tanstack/react-start/server'
    )
    const { fetchSession, getCookieName } = await import(
      '@convex-dev/better-auth/react-start'
    )
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

export const sessionQueryKey = ['session'] as const

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: () => fetchAuth(),
  staleTime: 1000 * 60 * 5, // 5 minutes - prevents refetch on navigation
  gcTime: 1000 * 60 * 30, // 30 minutes - keeps cached data longer
})
