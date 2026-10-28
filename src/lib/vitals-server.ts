import { createServerFn } from '@tanstack/react-start'
import { summarizeVitals } from './vitals'

/** The p75 summary of the last window, for the performance page. */
export const getVitalsSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { env } = await import('cloudflare:workers')
    const { listRecentVitals } = await import('./vitals-storage')
    const now = Date.now()
    try {
      return summarizeVitals(await listRecentVitals(env.CHAT_DB, now), now)
    } catch (error) {
      console.error('Unable to read web vitals', error)
      return null
    }
  },
)
