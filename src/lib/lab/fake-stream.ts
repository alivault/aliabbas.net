import { createCitationFilter } from '~/lib/chat/citation-filter'
import type { ChatSource, ChatStreamEvent } from '~/lib/chat/protocol'
import { LAB_ANSWER, LAB_SOURCES } from './fake-answer'

/**
 * A deterministic, client-only stand-in for /api/chat. It splits a fixed
 * answer into tokens of fixed sizes and passes them through the real
 * citation filter, so the events have the same order as the server's:
 * each cited source comes before the first text that cites it.
 */

/** The states a visitor can force on a specimen. */
export const LAB_SCENARIOS = [
  'idle',
  'loading',
  'slow',
  'streaming',
  'interrupted',
  'error',
  'done',
] as const

export type LabScenario = (typeof LAB_SCENARIOS)[number]

export const LAB_SCENARIO_LABELS: Record<LabScenario, string> = {
  idle: 'Idle',
  loading: 'Loading',
  slow: 'Slow',
  streaming: 'Streaming',
  interrupted: 'Interrupted',
  error: 'Error',
  done: 'Done',
}

export const LAB_SCENARIO_HINTS: Record<LabScenario, string> = {
  idle: 'No question yet. The empty state.',
  loading: 'The request is open, but no token arrives.',
  slow: 'A throttled stream: a long wait, then slow tokens.',
  streaming: 'A normal stream that runs to the end.',
  interrupted: 'The stream stops part way, as if you pressed Stop.',
  error: 'The connection fails part way. Retry starts again.',
  done: 'The full answer, with no stream.',
}

export type StreamPlan = {
  /** Delay before the first token. */
  firstTokenMs: number
  /** Delay between tokens. */
  tokenMs: number
  /** How the stream ends. */
  end:
    | { type: 'complete' }
    | { type: 'hold' }
    | { type: 'stop'; atFraction: number }
    | { type: 'fail'; atFraction: number; message: string }
}

export const LAB_ERROR_MESSAGE =
  'The connection closed before the answer finished.'

const NORMAL = { firstTokenMs: 450, tokenMs: 28 } as const

export const STREAM_PLANS: Record<
  Exclude<LabScenario, 'idle' | 'done'>,
  StreamPlan
> = {
  loading: { ...NORMAL, end: { type: 'hold' } },
  slow: { firstTokenMs: 1800, tokenMs: 120, end: { type: 'complete' } },
  streaming: { ...NORMAL, end: { type: 'complete' } },
  interrupted: { ...NORMAL, end: { type: 'stop', atFraction: 0.45 } },
  error: {
    ...NORMAL,
    end: { type: 'fail', atFraction: 0.6, message: LAB_ERROR_MESSAGE },
  },
}

/** Token sizes repeat in this cycle, so a run is the same every time. */
const TOKEN_SIZES = [3, 5, 2, 4, 6, 3, 4, 2, 5] as const

export function tokenize(text: string) {
  const tokens: Array<string> = []
  let index = 0
  let cycle = 0
  while (index < text.length) {
    const size = TOKEN_SIZES[cycle % TOKEN_SIZES.length]
    tokens.push(text.slice(index, index + size))
    index += size
    cycle += 1
  }
  return tokens
}

/**
 * The events for each token, after the citation filter. A step can be
 * empty when the filter holds back a part of a marker.
 */
export function buildStreamSteps(
  answer: string = LAB_ANSWER,
  sources: ReadonlyArray<ChatSource> = LAB_SOURCES,
): Array<Array<ChatStreamEvent>> {
  const byId = new Map(sources.map((source) => [source.id, source]))
  const filter = createCitationFilter(new Set(byId.keys()))
  const toEvents = (output: ReturnType<typeof filter.push>) => {
    const events: Array<ChatStreamEvent> = []
    for (const id of output.newSourceIds) {
      const source = byId.get(id)
      if (source) events.push({ type: 'source', source })
    }
    if (output.text) events.push({ type: 'delta', text: output.text })
    return events
  }
  const steps = tokenize(answer).map((token) => toEvents(filter.push(token)))
  const rest = toEvents(filter.flush())
  if (rest.length > 0) steps.push(rest)
  return steps
}

export type StreamCallbacks = {
  onEvent: (event: ChatStreamEvent) => void
  /** The plan stops the stream, as a visitor would with Stop. */
  onStop: () => void
}

/**
 * Play the steps on timers. Returns a function that cancels the stream.
 * After cancel, no callback runs again.
 */
export function playFakeStream(
  plan: StreamPlan,
  callbacks: StreamCallbacks,
  steps: Array<Array<ChatStreamEvent>> = buildStreamSteps(),
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let cancelled = false
  const cutoff =
    plan.end.type === 'stop' || plan.end.type === 'fail'
      ? Math.floor(steps.length * plan.end.atFraction)
      : steps.length

  const next = (index: number) => {
    if (cancelled) return
    if (index >= cutoff) {
      switch (plan.end.type) {
        case 'complete':
          callbacks.onEvent({ type: 'done' })
          return
        case 'stop':
          callbacks.onStop()
          return
        case 'fail':
          callbacks.onEvent({ type: 'error', message: plan.end.message })
          return
        case 'hold':
          return
      }
    }
    for (const event of steps[index]) callbacks.onEvent(event)
    timer = setTimeout(() => next(index + 1), plan.tokenMs)
  }

  if (plan.end.type !== 'hold') {
    timer = setTimeout(() => next(0), plan.firstTokenMs)
  }

  return () => {
    cancelled = true
    if (timer !== undefined) clearTimeout(timer)
  }
}
