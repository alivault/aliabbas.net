/**
 * Core Web Vitals from real visits: the metrics, Google's thresholds, and
 * the 75th percentile that the performance page shows. Pure functions, so
 * the server and the page use the same rules.
 */

export const METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const
export type MetricName = (typeof METRICS)[number]
export type Device = 'mobile' | 'desktop'
export type Rating = 'good' | 'needs-improvement' | 'poor'

export const METRIC_INFO: Record<
  MetricName,
  {
    label: string
    description: string
    unit: 'ms' | 'score'
    /** Good at or below the first value, poor above the second. */
    thresholds: [number, number]
    core: boolean
  }
> = {
  LCP: {
    label: 'Largest Contentful Paint',
    description: 'How long until the main content shows.',
    unit: 'ms',
    thresholds: [2500, 4000],
    core: true,
  },
  INP: {
    label: 'Interaction to Next Paint',
    description: 'How fast the page responds to a tap, click or key.',
    unit: 'ms',
    thresholds: [200, 500],
    core: true,
  },
  CLS: {
    label: 'Cumulative Layout Shift',
    description: 'How much the layout moves while the page loads.',
    unit: 'score',
    thresholds: [0.1, 0.25],
    core: true,
  },
  FCP: {
    label: 'First Contentful Paint',
    description: 'How long until the first text or image shows.',
    unit: 'ms',
    thresholds: [1800, 3000],
    core: false,
  },
  TTFB: {
    label: 'Time to First Byte',
    description: 'How long until the server starts to answer.',
    unit: 'ms',
    thresholds: [800, 1800],
    core: false,
  },
}

/** Fewer samples than this give a p75 that one slow visit can move. */
export const MIN_SAMPLES = 20
export const WINDOW_DAYS = 28
export const RETENTION_DAYS = 90

export function isMetricName(value: unknown): value is MetricName {
  return typeof value === 'string' && METRICS.includes(value as MetricName)
}

export function rate(name: MetricName, value: number): Rating {
  const [good, poor] = METRIC_INFO[name].thresholds
  return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor'
}

/** The nearest-rank 75th percentile, as the Chrome UX Report uses. */
export function percentile75(values: ReadonlyArray<number>) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.ceil(sorted.length * 0.75) - 1]
}

export function formatMetric(name: MetricName, value: number) {
  if (METRIC_INFO[name].unit === 'score') return value.toFixed(2)
  return value >= 1000
    ? `${(value / 1000).toFixed(2)} s`
    : `${Math.round(value)} ms`
}

export type MetricSummary = {
  count: number
  p75: number | null
  rating: Rating | null
  /** Share of samples in each rating, from 0 to 1. */
  shares: Record<Rating, number>
}

export type VitalsSummary = {
  windowDays: number
  generatedAt: number
  pageLoads: number
  metrics: Record<
    MetricName,
    { all: MetricSummary; mobile: MetricSummary; desktop: MetricSummary }
  >
}

export type VitalsRow = { name: string; device: string; value: number }

function summarize(name: MetricName, values: Array<number>): MetricSummary {
  const shares: Record<Rating, number> = {
    good: 0,
    'needs-improvement': 0,
    poor: 0,
  }
  for (const value of values) shares[rate(name, value)] += 1
  for (const key of Object.keys(shares) as Array<Rating>) {
    shares[key] = values.length ? shares[key] / values.length : 0
  }
  const p75 = values.length >= MIN_SAMPLES ? percentile75(values) : null
  return {
    count: values.length,
    p75,
    rating: p75 === null ? null : rate(name, p75),
    shares,
  }
}

export function summarizeVitals(
  rows: ReadonlyArray<VitalsRow>,
  generatedAt: number,
): VitalsSummary {
  const metrics = {} as VitalsSummary['metrics']
  for (const name of METRICS) {
    const all: Array<number> = []
    const mobile: Array<number> = []
    const desktop: Array<number> = []
    for (const row of rows) {
      if (row.name !== name) continue
      all.push(row.value)
      if (row.device === 'mobile') mobile.push(row.value)
      else desktop.push(row.value)
    }
    metrics[name] = {
      all: summarize(name, all),
      mobile: summarize(name, mobile),
      desktop: summarize(name, desktop),
    }
  }
  return {
    windowDays: WINDOW_DAYS,
    generatedAt,
    // Each page load reports TTFB once, so it counts page loads.
    pageLoads: metrics.TTFB.all.count,
    metrics,
  }
}

/**
 * The route of a path, without slugs or query, so the data has no full
 * URLs: "/notes/some-post?x=1" becomes "/notes/$slug".
 */
export function routeOf(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return '/'
  const first = parts[0]
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30)
  return parts.length > 1 ? `/${first}/$slug` : `/${first}`
}

export const ROUTE_PATTERN = /^\/([a-z0-9-]{1,30}(\/\$slug)?)?$/
