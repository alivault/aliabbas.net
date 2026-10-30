import { cn } from '~/lib/utils'
import { METRICS, METRIC_INFO, MIN_SAMPLES, formatMetric } from '~/lib/vitals'
import type {
  MetricName,
  MetricSummary,
  Rating,
  VitalsSummary,
} from '~/lib/vitals'

const RATING_LABEL: Record<Rating, string> = {
  good: 'Good',
  'needs-improvement': 'Needs work',
  poor: 'Poor',
}

const RATING_TEXT: Record<Rating, string> = {
  good: 'text-verified',
  'needs-improvement': 'text-partial',
  poor: 'text-contradicted',
}

const RATING_BAR: Record<Rating, string> = {
  good: 'bg-verified',
  'needs-improvement': 'bg-partial',
  poor: 'bg-contradicted',
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function Distribution({ summary }: { summary: MetricSummary }) {
  const ratings: Array<Rating> = ['good', 'needs-improvement', 'poor']
  const text = ratings
    .map(
      (rating) =>
        `${Math.round(summary.shares[rating] * 100)}% ${RATING_LABEL[rating].toLowerCase()}`,
    )
    .join(', ')
  return (
    <div>
      <div
        role="img"
        aria-label={`Of all samples: ${text}.`}
        className="bg-foreground/10 flex h-1.5 overflow-hidden rounded-full"
      >
        {ratings.map((rating) => (
          <span
            key={rating}
            className={RATING_BAR[rating]}
            style={{ width: `${summary.shares[rating] * 100}%` }}
          />
        ))}
      </div>
      <p aria-hidden="true" className="text-fg-muted mt-2 text-sm">
        {text}
      </p>
    </div>
  )
}

function DeviceValue({
  label,
  name,
  summary,
}: {
  label: string
  name: MetricName
  summary: MetricSummary
}) {
  return (
    <div>
      <dt className="text-fg-muted text-sm">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums">
        {summary.p75 === null ? (
          <span className="text-fg-muted font-normal">
            {summary.count} of {MIN_SAMPLES}
          </span>
        ) : (
          formatMetric(name, summary.p75)
        )}
      </dd>
    </div>
  )
}

function MetricCard({
  name,
  summary,
}: {
  name: MetricName
  summary: VitalsSummary['metrics'][MetricName]
}) {
  const info = METRIC_INFO[name]
  const { all } = summary
  const [good, poor] = info.thresholds
  return (
    <article
      aria-labelledby={`metric-${name}`}
      className="border-foreground/10 flex flex-col gap-5 rounded-xl border p-5"
    >
      <header>
        <h3 id={`metric-${name}`} className="text-base font-semibold">
          {info.label} ({name})
        </h3>
        <p className="text-fg-muted mt-1 text-sm leading-6">
          {info.core && (
            <span className="text-foreground font-medium">
              Core Web Vital.{' '}
            </span>
          )}
          {info.description}
        </p>
      </header>

      {all.p75 === null || all.rating === null ? (
        <p className="text-fg-muted text-sm leading-6">
          Collecting: {all.count} of {MIN_SAMPLES} page loads. With fewer
          samples, one slow visit moves the number too much to show it.
        </p>
      ) : (
        <div>
          <p className="flex items-baseline gap-3">
            <span className="text-4xl font-medium tracking-tight tabular-nums">
              {formatMetric(name, all.p75)}
            </span>
            <span
              className={cn('text-sm font-semibold', RATING_TEXT[all.rating])}
            >
              {RATING_LABEL[all.rating]}
            </span>
          </p>
          <p className="text-fg-muted mt-1 text-sm leading-6">
            p75 of {plural(all.count, 'sample')} · good ≤{' '}
            {formatMetric(name, good)}, poor &gt; {formatMetric(name, poor)}
          </p>
        </div>
      )}

      {all.count > 0 && <Distribution summary={all} />}

      <dl className="border-foreground/10 mt-auto grid grid-cols-2 gap-4 border-t pt-4">
        <DeviceValue label="Mobile p75" name={name} summary={summary.mobile} />
        <DeviceValue
          label="Desktop p75"
          name={name}
          summary={summary.desktop}
        />
      </dl>
    </article>
  )
}

/** Real-visit Core Web Vitals, or an honest empty state. */
export default function VitalsPanel({
  summary,
}: {
  summary: VitalsSummary | null
}) {
  if (!summary) {
    return (
      <p role="alert" className="text-fg-muted text-sm">
        The measurements could not be read right now. Please reload the page.
      </p>
    )
  }
  return (
    <div>
      <p className="text-fg-muted text-sm">
        {plural(summary.pageLoads, 'page load')} in the last{' '}
        {summary.windowDays} days.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {METRICS.map((name) => (
          <MetricCard key={name} name={name} summary={summary.metrics[name]} />
        ))}
      </div>
    </div>
  )
}
