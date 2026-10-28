export function errorResponse(error: string, status: number) {
  return Response.json(
    { error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

export function isSameOrigin(request: Request) {
  const requestOrigin = request.headers.get('Origin')
  return !requestOrigin || requestOrigin === new URL(request.url).origin
}

/** The key for the per-visitor rate limiter. */
export function rateLimitKey(request: Request) {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('User-Agent')?.slice(0, 160) ??
    'anonymous'
  )
}
