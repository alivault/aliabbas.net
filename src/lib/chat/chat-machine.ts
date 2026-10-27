import type { ChatSource } from './protocol'

/**
 * The chat as a state machine. Each question is a turn:
 *
 *   pending ──delta──▶ streaming ──complete──▶ complete
 *      │                   │
 *      ├──stop─────────────┴──▶ stopped     (the user interrupted)
 *      └──fail─────────────┴──▶ failed      (network, server or timeout)
 *
 *   stopped | failed | complete ──retry──▶ pending   (last turn only)
 *
 * Only one turn is active (pending or streaming) at a time. A new question
 * while a turn is active stops that turn first. Every stream event carries
 * the attempt id it belongs to, and the reducer ignores events for an
 * attempt that is not active. So a late chunk from a stopped or retried
 * request can never write into the wrong answer.
 */

export type TurnStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'stopped'
  | 'failed'

export type Turn = {
  id: string
  attemptId: string
  question: string
  answer: string
  /** Cited sources, in order of first citation. Chip numbers follow this order. */
  sources: Array<ChatSource>
  status: TurnStatus
  error?: string
  startedAt: number
  firstTokenAt?: number
  endedAt?: number
}

export type ChatState = { turns: Array<Turn> }

export type ChatEvent =
  | {
      type: 'submit'
      turnId: string
      attemptId: string
      question: string
      at: number
    }
  | { type: 'source'; attemptId: string; source: ChatSource }
  | { type: 'delta'; attemptId: string; text: string; at: number }
  | { type: 'complete'; attemptId: string; at: number }
  | { type: 'fail'; attemptId: string; message: string; at: number }
  | { type: 'stop'; at: number }
  | { type: 'retry'; turnId: string; attemptId: string; at: number }
  | { type: 'remove'; turnId: string }

export const initialChatState: ChatState = { turns: [] }

export function isActive(turn: Turn) {
  return turn.status === 'pending' || turn.status === 'streaming'
}

export function getActiveTurn(state: ChatState) {
  const last = state.turns.at(-1)
  return last && isActive(last) ? last : undefined
}

function stopActive(turns: Array<Turn>, at: number) {
  return turns.map((turn) =>
    isActive(turn)
      ? { ...turn, status: 'stopped' as const, endedAt: at }
      : turn,
  )
}

function updateAttempt(
  state: ChatState,
  attemptId: string,
  update: (turn: Turn) => Turn,
): ChatState {
  const index = state.turns.findIndex(
    (turn) => turn.attemptId === attemptId && isActive(turn),
  )
  if (index === -1) return state
  const turns = state.turns.slice()
  turns[index] = update(turns[index])
  return { turns }
}

export function chatReducer(state: ChatState, event: ChatEvent): ChatState {
  switch (event.type) {
    case 'submit':
      return {
        turns: [
          ...stopActive(state.turns, event.at),
          {
            id: event.turnId,
            attemptId: event.attemptId,
            question: event.question,
            answer: '',
            sources: [],
            status: 'pending',
            startedAt: event.at,
          },
        ],
      }

    case 'source':
      return updateAttempt(state, event.attemptId, (turn) =>
        turn.sources.some((source) => source.id === event.source.id)
          ? turn
          : { ...turn, sources: [...turn.sources, event.source] },
      )

    case 'delta':
      if (!event.text) return state
      return updateAttempt(state, event.attemptId, (turn) => ({
        ...turn,
        answer: turn.answer + event.text,
        status: 'streaming',
        firstTokenAt: turn.firstTokenAt ?? event.at,
      }))

    case 'complete':
      return updateAttempt(state, event.attemptId, (turn) =>
        turn.answer.trim()
          ? { ...turn, status: 'complete', endedAt: event.at }
          : {
              ...turn,
              status: 'failed',
              error: 'The assistant returned an empty answer.',
              endedAt: event.at,
            },
      )

    case 'fail':
      return updateAttempt(state, event.attemptId, (turn) => ({
        ...turn,
        status: 'failed',
        error: event.message,
        endedAt: event.at,
      }))

    case 'stop':
      return getActiveTurn(state)
        ? { turns: stopActive(state.turns, event.at) }
        : state

    case 'retry': {
      const last = state.turns.at(-1)
      if (!last || last.id !== event.turnId || isActive(last)) return state
      return {
        turns: [
          ...state.turns.slice(0, -1),
          {
            id: last.id,
            attemptId: event.attemptId,
            question: last.question,
            answer: '',
            sources: [],
            status: 'pending',
            startedAt: event.at,
          },
        ],
      }
    }

    case 'remove': {
      const last = state.turns.at(-1)
      if (!last || last.id !== event.turnId || isActive(last)) return state
      return { turns: state.turns.slice(0, -1) }
    }
  }
}

export type HistoryMessage = { role: 'user' | 'assistant'; content: string }

/**
 * The conversation to send with a new question: earlier turns that have an
 * answer, as user and assistant pairs, then the question. A turn without an
 * answer (failed, or stopped before the first token) is left out, because
 * the server needs strict user/assistant order.
 */
export function buildRequestMessages(
  turns: ReadonlyArray<Turn>,
  question: string,
  maxPairs = 4,
): Array<HistoryMessage> {
  const pairs = turns
    .filter(
      (turn) =>
        !isActive(turn) && turn.status !== 'failed' && turn.answer.trim(),
    )
    .slice(-maxPairs)
    .flatMap((turn) => [
      { role: 'user' as const, content: turn.question },
      { role: 'assistant' as const, content: turn.answer.slice(0, 5000) },
    ])
  return [...pairs, { role: 'user', content: question }]
}
