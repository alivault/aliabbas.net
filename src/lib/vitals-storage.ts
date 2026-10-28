import { RETENTION_DAYS, WINDOW_DAYS } from './vitals'
import type { Device, MetricName, Rating, VitalsRow } from './vitals'

const DAY_MS = 24 * 60 * 60 * 1000

export type StoredMetric = {
  id: string
  name: MetricName
  value: number
  rating: Rating
  path: string
  device: Device
  navigationType: string | null
}

export async function storeVitals(
  database: D1Database,
  metrics: ReadonlyArray<StoredMetric>,
  now: number,
) {
  if (metrics.length === 0) return
  // A metric can report again with the same id (for example CLS after more
  // shifts), so the last value replaces the first.
  await database.batch(
    metrics.map((metric) =>
      database
        .prepare(
          `INSERT OR REPLACE INTO web_vitals
            (id, name, value, rating, path, device, navigation_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          metric.id,
          metric.name,
          metric.value,
          metric.rating,
          metric.path,
          metric.device,
          metric.navigationType,
          now,
        ),
    ),
  )
}

/** The samples of the last window, for the p75 summary. */
export async function listRecentVitals(database: D1Database, now: number) {
  const result = await database
    .prepare(
      `SELECT name, device, value FROM web_vitals
       WHERE created_at > ? AND path NOT LIKE '/admin%'
       LIMIT 100000`,
    )
    .bind(now - WINDOW_DAYS * DAY_MS)
    .all<VitalsRow>()
  return result.results
}

export async function purgeExpiredVitals(database: D1Database) {
  return database
    .prepare('DELETE FROM web_vitals WHERE created_at < ?')
    .bind(Date.now() - RETENTION_DAYS * DAY_MS)
    .run()
}
