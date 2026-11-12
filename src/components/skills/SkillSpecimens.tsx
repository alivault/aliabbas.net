import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Play,
  Square,
  Zap,
} from 'lucide-react'
import { useInView } from 'motion/react'
import { StateTrack } from '~/components/lab/StateBar'
import { useLabStream } from '~/components/lab/use-lab-stream'
import type { LabMachineState } from '~/components/lab/use-lab-stream'
import { Button } from '~/components/ui/button'
import type { Capability } from '~/data/capabilities'
import { SCHEME_STYLES } from '~/lib/design/tokens'
import { MIN_SAMPLES, formatMetric } from '~/lib/vitals'
import type { MetricName, Rating } from '~/lib/vitals'
import { getVitalsSummary } from '~/lib/vitals-server'
import { cn } from 'cn'
import Frame from './Frame'
import ThrowExample from './ThrowExample'

const STREAM_STATUS: Record<LabMachineState, string> = {
  idle: 'Idle. No answer.',
  pending: 'Loading. Waiting for the first token.',
  streaming: 'Streaming.',
  complete: 'Done.',
  stopped: 'Stopped. The text that arrived stays.',
  failed: 'Failed. The text that arrived stays.',
}

/** The tail of the answer, without citation markers, so it fits the card. */
function answerTail(answer: string) {
  const text = answer
    .replace(/\s*\[S\d+\]/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[`*]/g, '')
    .replace(/\s+/g, ' ')
  return text.length > 150 ? `…${text.slice(-150).trimStart()}` : text
}

/** The real chat state machine, driven by the fake stream of the Lab. */
function StreamingExample() {
  const { isActive, machineState, run, stop, turn } = useLabStream('idle')
  const streamRef = useRef<HTMLButtonElement>(null)
  const stopRef = useRef<HTMLButtonElement>(null)
  const ended = machineState === 'stopped' || machineState === 'failed'

  const start = (scenario: 'streaming' | 'error') => {
    run(scenario)
    // Focus goes to Stop, so Enter or Esc stops the stream at once.
    requestAnimationFrame(() => stopRef.current?.focus())
  }

  // When the stream ends, Stop is disabled. Focus moves from it to Stream,
  // the next action, so a disabled button does not look active.
  useEffect(() => {
    if (!isActive && document.activeElement === stopRef.current) {
      streamRef.current?.focus()
    }
  }, [isActive])

  return (
    <Frame
      caption="The chat’s real state machine and a fake stream. Esc stops it."
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !isActive) return
        event.preventDefault()
        stop()
      }}
    >
      <StateTrack state={machineState} />
      <div className="text-fg-secondary mt-4 min-h-20 flex-1 text-sm leading-6">
        {machineState === 'idle' && (
          <p className="text-fg-muted">Press Stream to start an answer.</p>
        )}
        {machineState === 'pending' && (
          <p className="text-fg-muted">Waiting for the first token…</p>
        )}
        {turn && turn.answer && (
          <p className={cn(ended && 'text-fg-muted')}>
            {answerTail(turn.answer)}
            {ended && (
              // Marks the place where the text stopped.
              <span
                aria-hidden="true"
                className={cn(
                  'ml-1 inline-block size-2 align-middle',
                  machineState === 'failed' ? 'bg-destructive' : 'bg-brand',
                )}
              />
            )}
          </p>
        )}
        {machineState === 'failed' && (
          <p className="border-destructive/40 bg-destructive/10 text-foreground mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1">
            <CircleX
              aria-hidden="true"
              className="text-destructive size-4 shrink-0"
            />
            The connection failed. The text that arrived stays.
          </p>
        )}
        {machineState === 'stopped' && (
          <p className="border-brand/40 bg-brand/10 text-foreground mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1">
            <Square
              aria-hidden="true"
              className="fill-brand text-brand size-3 shrink-0"
            />
            Stopped. The text that arrived stays.
          </p>
        )}
      </div>
      <p role="status" className="sr-only">
        {STREAM_STATUS[machineState]}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          ref={streamRef}
          variant="secondary"
          onClick={() => start('streaming')}
        >
          <Play aria-hidden="true" />
          Stream
        </Button>
        <Button variant="secondary" onClick={() => start('error')}>
          <Zap aria-hidden="true" />
          Stream and fail
        </Button>
        <Button
          ref={stopRef}
          variant="secondary"
          onClick={stop}
          disabled={!isActive}
          // Focus stays on Stop when the stream ends, so it is not lost.
          focusableWhenDisabled
          aria-keyshortcuts="Escape"
        >
          <Square className="fill-current" aria-hidden="true" />
          Stop
        </Button>
      </div>
    </Frame>
  )
}

/** One small interface, drawn with the light and the dark token values. */
function SchemeHalf({ scheme }: { scheme: 'light' | 'dark' }) {
  return (
    <div
      style={SCHEME_STYLES[scheme] as CSSProperties}
      className="bg-background text-foreground border-border flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-sm font-semibold">
        {scheme === 'light' ? 'Light' : 'Dark'}
      </p>
      <p className="text-fg-muted text-sm leading-6">
        One component, the same tokens.
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        <span className="bg-brand text-brand-foreground inline-flex h-8 items-center rounded-full px-3.5 text-sm font-semibold">
          Primary
        </span>
        <span className="border-border bg-card text-fg-secondary inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-semibold">
          Secondary
        </span>
      </div>
    </div>
  )
}

function DesignSystemExample() {
  return (
    <Frame caption="The same tokens in both color schemes. The design rules are on /design.">
      <div
        role="img"
        aria-label="A primary and a secondary button, drawn once with the light tokens and once with the dark tokens."
        className="grid flex-1 grid-cols-2 gap-3"
      >
        <SchemeHalf scheme="light" />
        <SchemeHalf scheme="dark" />
      </div>
      <p className="text-fg-muted mt-4 font-mono text-sm">
        bg-brand · bg-card · text-fg-muted
      </p>
    </Frame>
  )
}

const SHOWN_METRICS: ReadonlyArray<MetricName> = ['LCP', 'INP', 'CLS']

const RATING: Record<
  Rating,
  { label: string; icon: typeof CircleCheck; className: string }
> = {
  good: { label: 'Good', icon: CircleCheck, className: 'text-verified' },
  'needs-improvement': {
    label: 'Needs work',
    icon: CircleAlert,
    className: 'text-partial',
  },
  poor: { label: 'Poor', icon: CircleX, className: 'text-contradicted' },
}

/** Core Web Vitals from real visits. It loads when it comes into view. */
function VitalsExample() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '200px' })
  const { data, isPending, isError } = useQuery({
    queryKey: ['vitals-summary'],
    queryFn: () => getVitalsSummary(),
    enabled: inView,
    staleTime: 5 * 60 * 1000,
  })
  const summary = isError ? null : data

  return (
    <Frame caption="The 75th percentile of real visits to this site, from the last 28 days.">
      <div ref={ref} className="flex flex-1 flex-col">
        {summary === null ? (
          <p className="text-fg-muted flex items-center gap-1.5 text-sm">
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
            The measurements could not be read right now.
          </p>
        ) : (
          <dl aria-busy={isPending} className="grid flex-1 grid-cols-3 gap-4">
            {SHOWN_METRICS.map((name) => {
              const metric = summary?.metrics[name].all
              const rating = metric?.rating ? RATING[metric.rating] : null
              const Icon = rating?.icon
              return (
                <div key={name} className="flex flex-col">
                  <dt className="text-fg-muted text-sm">{name}</dt>
                  <dd className="mt-auto pt-6">
                    <span className="block text-3xl font-medium tracking-tight tabular-nums">
                      {metric?.p75 != null
                        ? formatMetric(name, metric.p75)
                        : '—'}
                    </span>
                    <span
                      className={cn(
                        'mt-1 flex items-center gap-1 text-sm',
                        rating?.className ?? 'text-fg-muted',
                      )}
                    >
                      {Icon && (
                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                      )}
                      {isPending
                        ? 'Loading'
                        : rating
                          ? rating.label
                          : `Collecting, ${metric?.count ?? 0} of ${MIN_SAMPLES}`}
                    </span>
                  </dd>
                </div>
              )
            })}
          </dl>
        )}
      </div>
    </Frame>
  )
}

const EXAMPLES: Record<Capability['id'], () => ReactNode> = {
  streaming: StreamingExample,
  motion: ThrowExample,
  'design-systems': DesignSystemExample,
  performance: VitalsExample,
}

/** The live example for one skill. */
export default function SkillSpecimen({ id }: { id: Capability['id'] }) {
  const Example = EXAMPLES[id]
  return <Example />
}
