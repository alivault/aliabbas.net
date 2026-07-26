import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getToken } from './auth-server'

// Get auth information for SSR using available cookies
export const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const token = await getToken()
    return {
      userId: undefined,
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
