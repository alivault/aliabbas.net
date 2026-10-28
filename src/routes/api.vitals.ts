import { errorResponse, isSameOrigin, rateLimitKey } from '~/lib/http'
import { ROUTE_PATTERN, isMetricName, rate } from '~/lib/vitals'
import { storeVitals } from '~/lib/vitals-storage'
import type { StoredMetric } from '~/lib/vitals-storage'
import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'

const BeaconSchema = z.object({
  path: z.string().regex(ROUTE_PATTERN),
  device: z.enum(['mobile', 'desktop']),
  metrics: z
    .array(
      z.object({
        id: z.string().regex(/^v\d-[A-Za-z0-9.-]{4,80}$/),
        name: z.string(),
        // Larger values are broken measurements, not slow pages.
        value: z.number().finite().min(0).max(120_000),
        navigationType: z.string().max(24).optional(),
      }),
    )
    .min(1)
    .max(10),
})

/** Store Core Web Vitals from one page load. The page never waits for this. */
export const Route = createFileRoute('/api/vitals')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOrigin(request)) return errorResponse('Forbidden.', 403)
        if (Number(request.headers.get('Content-Length') ?? 0) > 4_000) {
          return errorResponse('Too large.', 413)
        }
        const { success } = await env.VITALS_RATE_LIMITER.limit({
          key: rateLimitKey(request),
        })
        if (!success) return new Response(null, { status: 429 })

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return errorResponse('Not JSON.', 400)
        }
        const parsed = BeaconSchema.safeParse(body)
        if (!parsed.success) return errorResponse('Not valid.', 400)

        const { path, device, metrics } = parsed.data
        const rows: Array<StoredMetric> = []
        for (const metric of metrics) {
          if (!isMetricName(metric.name)) continue
          // CLS is a score; the rest are milliseconds.
          if (metric.name === 'CLS' && metric.value > 10) continue
          rows.push({
            id: metric.id,
            name: metric.name,
            value: metric.value,
            // Rate on the server, so a client cannot send its own rating.
            rating: rate(metric.name, metric.value),
            path,
            device,
            navigationType: metric.navigationType ?? null,
          })
        }

        try {
          await storeVitals(env.CHAT_DB, rows, Date.now())
        } catch (error) {
          console.error('Unable to store web vitals', error)
          return new Response(null, { status: 503 })
        }
        return new Response(null, {
          status: 204,
          headers: { 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
