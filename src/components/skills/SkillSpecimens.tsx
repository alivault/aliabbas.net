import { useId, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Play,
  Square,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { StateTrack } from '~/components/lab/StateBar'
import { useLabStream } from '~/components/lab/use-lab-stream'
import type { LabMachineState } from '~/components/lab/use-lab-stream'
import { Button } from '~/components/ui/button'
import type { Capability } from '~/data/capabilities'
import { DURATIONS, EASE_IN, EASE_OUT, SPRINGS } from '~/lib/design/motion'
import { SCHEME_STYLES } from '~/lib/design/tokens'
import { MIN_SAMPLES, formatMetric } from '~/lib/vitals'
import type { MetricName, Rating } from '~/lib/vitals'
import { getVitalsSummary } from '~/lib/vitals-server'
import { cn } from 'cn'

/** The frame of each example: a card with a caption under it. */
function Frame({
  caption,
  children,
  className,
  onKeyDown,
}: {
  caption: ReactNode
  children: ReactNode
  className?: string
  onKeyDown?: (event: KeyboardEvent) => void
}) {
  return (
    <figure className="min-w-0">
      <div
        onKeyDown={onKeyDown}
        className={cn(
          'border-border bg-card flex min-h-56 flex-col rounded-xl border p-5',
          className,
        )}
      >
        {children}
      </div>
      <figcaption className="text-fg-muted mt-3 text-sm leading-6">
        {caption}
      </figcaption>
    </figure>
  )
}

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
  const stopRef = useRef<HTMLButtonElement>(null)

  const start = (scenario: 'streaming' | 'error') => {
    run(scenario)
    // Focus goes to Stop, so Enter or Esc stops the stream at once.
    requestAnimationFrame(() => stopRef.current?.focus())
  }

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
        {turn && turn.answer && <p>{answerTail(turn.answer)}</p>}
        {machineState === 'failed' && (
          <p className="text-destructive mt-2 flex items-center gap-1.5">
            <CircleX aria-hidden="true" className="size-4 shrink-0" />
            The connection failed. The text that arrived stays.
          </p>
        )}
        {machineState === 'stopped' && (
          <p className="text-fg-muted mt-2 flex items-center gap-1.5">
            <Square aria-hidden="true" className="size-3.5 shrink-0" />
            Stopped. The text that arrived stays.
          </p>
        )}
      </div>
      <p role="status" className="sr-only">
        {STREAM_STATUS[machineState]}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => start('streaming')}>
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

const VIEWS = [
  {
    id: 'answer',
    label: 'Answer',
    body: 'The indicator slides on a spring. The panel enters with the ease for things that enter.',
  },
  {
    id: 'sources',
    label: 'Sources',
    body: 'Each panel keeps its place. Switch back and nothing starts again.',
  },
  {
    id: 'notes',
    label: 'Notes',
    body: 'With reduced motion on, the indicator jumps and only the opacity changes.',
  },
] as const

type ViewId = (typeof VIEWS)[number]['id']

/** A tab list with a sliding indicator, as the mode pill of the chat. */
function MotionExample() {
  const [view, setView] = useState<ViewId>('answer')
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const groupId = useId()

  const move = (event: KeyboardEvent, index: number) => {
    const last = VIEWS.length - 1
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    refs.current[next]?.focus()
    setView(VIEWS[next].id)
  }

  const current = VIEWS.find((item) => item.id === view) ?? VIEWS[0]

  return (
    <Frame caption="Arrow keys move between the tabs. The indicator uses SPRINGS.settle.">
      <div
        role="tablist"
        aria-label="Motion example"
        className="bg-muted flex w-fit gap-1 rounded-full p-1"
      >
        {VIEWS.map((item, index) => {
          const selected = item.id === view
          return (
            <button
              key={item.id}
              ref={(element) => {
                refs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`${groupId}-${item.id}-tab`}
              aria-selected={selected}
              aria-controls={`${groupId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setView(item.id)}
              onKeyDown={(event) => move(event, index)}
              className={cn(
                'focus-visible:ring-ring/50 relative h-8 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3',
                selected
                  ? 'text-background'
                  : 'text-fg-muted hover:text-foreground',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${groupId}-indicator`}
                  transition={SPRINGS.settle}
                  className="bg-foreground absolute inset-0 rounded-full"
                />
              )}
              <span className="relative">{item.label}</span>
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${groupId}-panel`}
        aria-labelledby={`${groupId}-${view}-tab`}
        className="relative mt-5 flex-1"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: DURATIONS.enter, ease: EASE_OUT },
            }}
            exit={{
              opacity: 0,
              y: -6,
              transition: { duration: DURATIONS.exit, ease: EASE_IN },
            }}
            className="text-fg-secondary max-w-sm text-base leading-7"
          >
            {current.body}
          </motion.p>
        </AnimatePresence>
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
  motion: MotionExample,
  'design-systems': DesignSystemExample,
  performance: VitalsExample,
}

/** The live example for one skill. */
export default function SkillSpecimen({ id }: { id: Capability['id'] }) {
  const Example = EXAMPLES[id]
  return <Example />
}
