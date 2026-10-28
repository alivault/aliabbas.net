import { useEffect } from 'react'
import { routeOf } from '~/lib/vitals'

type Pending = {
  id: string
  name: string
  value: number
  navigationType?: string
}

/**
 * Send Core Web Vitals of this page load to /api/vitals, in production
 * only. The metrics go out in one request when the page is hidden, so
 * measuring never competes with the page for the network. web-vitals loads
 * after the page is idle, so it is not part of the first bundle.
 */
export default function VitalsReporter() {
  useEffect(() => {
    if (!import.meta.env.PROD) return
    const path = routeOf(window.location.pathname)
    if (path.startsWith('/admin')) return
    const device = window.matchMedia('(min-width: 1024px)').matches
      ? 'desktop'
      : 'mobile'
    const queue = new Map<string, Pending>()

    const flush = () => {
      if (queue.size === 0) return
      const body = JSON.stringify({
        path,
        device,
        metrics: [...queue.values()],
      })
      queue.clear()
      void fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined)
    }
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    let cancelled = false
    const start = () =>
      void import('web-vitals').then(
        ({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
          if (cancelled) return
          const report = (metric: {
            id: string
            name: string
            value: number
            navigationType: string
          }) => {
            queue.set(metric.id, {
              id: metric.id,
              name: metric.name,
              value: metric.value,
              navigationType: metric.navigationType,
            })
          }
          onCLS(report)
          onFCP(report)
          onINP(report)
          onLCP(report)
          onTTFB(report)
        },
      )

    // Safari has no requestIdleCallback.
    const hasIdle = typeof window.requestIdleCallback === 'function'
    const idle = hasIdle
      ? window.requestIdleCallback(start, { timeout: 3000 })
      : globalThis.setTimeout(start, 1500)
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', flush)
    return () => {
      cancelled = true
      if (hasIdle) window.cancelIdleCallback(idle as number)
      else globalThis.clearTimeout(idle)
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', flush)
    }
  }, [])

  return null
}
