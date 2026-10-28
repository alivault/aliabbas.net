import type { ChatSource } from '~/lib/chat/protocol'
import { overallVerdict } from './verdicts'
import type { Verdict } from './verdicts'
import type { Grade } from './evidence'
import type { ClaimPart } from './protocol'

/**
 * One claim check as a state machine:
 *
 *   idle ──submit──▶ splitting ──parts──▶ checking ──done──▶ complete
 *                       │                     │
 *                       ├──stop───────────────┴──▶ stopped
 *                       └──fail───────────────┴──▶ failed
 *
 *   any state except splitting | checking ──submit──▶ splitting
 *
 * Each part has its own state: checking ──grade──▶ graded, or ──part-error──▶
 * failed, or ──stop──▶ stopped. Parts finish in any order. Events carry the
 * attempt id, and the reducer ignores events of an attempt that is not the
 * current one, so a late grade from an old check never shows in a new one.
 */

export type CheckStatus =
  | 'idle'
  | 'splitting'
  | 'checking'
  | 'complete'
  | 'stopped'
  | 'failed'

export type PartStatus = 'checking' | 'graded' | 'failed' | 'stopped'

export type CheckedPart = ClaimPart & {
  status: PartStatus
  grade?: Grade
  error?: string
}

export type CheckState = {
  status: CheckStatus
  attemptId: string | null
  claim: string
  parts: Array<CheckedPart>
  sources: Array<ChatSource>
  /** The grade of the whole claim. Set only when the check is complete. */
  verdict?: Verdict
  error?: string
  startedAt?: number
  endedAt?: number
}

export type CheckEvent =
  | { type: 'submit'; attemptId: string; claim: string; at: number }
  | { type: 'parts'; attemptId: string; parts: Array<ClaimPart> }
  | { type: 'source'; attemptId: string; source: ChatSource }
  | { type: 'grade'; attemptId: string; partId: string; grade: Grade }
  | { type: 'part-error'; attemptId: string; partId: string; message: string }
  | { type: 'done'; attemptId: string; at: number }
  | { type: 'fail'; attemptId: string; message: string; at: number }
  | { type: 'stop'; at: number }

export const initialCheckState: CheckState = {
  status: 'idle',
  attemptId: null,
  claim: '',
  parts: [],
  sources: [],
}

export function isChecking(state: CheckState) {
  return state.status === 'splitting' || state.status === 'checking'
}

/** A failed part counts as unknown: the checker could not show anything. */
export function verdictOf(parts: ReadonlyArray<CheckedPart>) {
  return overallVerdict(parts.map((part) => part.grade?.verdict ?? 'unknown'))
}

function updatePart(
  state: CheckState,
  partId: string,
  update: (part: CheckedPart) => CheckedPart,
): CheckState {
  return {
    ...state,
    parts: state.parts.map((part) =>
      part.id === partId && part.status === 'checking' ? update(part) : part,
    ),
  }
}

export function checkReducer(state: CheckState, event: CheckEvent): CheckState {
  if (event.type === 'submit') {
    return {
      status: 'splitting',
      attemptId: event.attemptId,
      claim: event.claim,
      parts: [],
      sources: [],
      startedAt: event.at,
    }
  }

  if (event.type === 'stop') {
    if (!isChecking(state)) return state
    return {
      ...state,
      status: 'stopped',
      endedAt: event.at,
      parts: state.parts.map((part) =>
        part.status === 'checking'
          ? { ...part, status: 'stopped' as const }
          : part,
      ),
    }
  }

  // Every other event belongs to an attempt. Skip events of an old attempt,
  // and events that arrive after the check ended.
  if (event.attemptId !== state.attemptId || !isChecking(state)) return state

  switch (event.type) {
    case 'parts':
      if (state.status !== 'splitting') return state
      return {
        ...state,
        status: 'checking',
        parts: event.parts.map((part) => ({ ...part, status: 'checking' })),
      }

    case 'source':
      return state.sources.some((source) => source.id === event.source.id)
        ? state
        : { ...state, sources: [...state.sources, event.source] }

    case 'grade':
      return updatePart(state, event.partId, (part) => ({
        ...part,
        status: 'graded',
        grade: event.grade,
      }))

    case 'part-error':
      return updatePart(state, event.partId, (part) => ({
        ...part,
        status: 'failed',
        error: event.message,
      }))

    case 'done': {
      if (state.status !== 'checking') {
        return {
          ...state,
          status: 'failed',
          error: 'The checker did not split the claim. Please try again.',
          endedAt: event.at,
        }
      }
      // A part without a result at the end failed silently.
      const parts = state.parts.map((part) =>
        part.status === 'checking'
          ? {
              ...part,
              status: 'failed' as const,
              error: 'The checker did not grade this part.',
            }
          : part,
      )
      return {
        ...state,
        status: 'complete',
        parts,
        verdict: verdictOf(parts),
        endedAt: event.at,
      }
    }

    case 'fail':
      return {
        ...state,
        status: 'failed',
        error: event.message,
        endedAt: event.at,
        parts: state.parts.map((part) =>
          part.status === 'checking'
            ? { ...part, status: 'stopped' as const }
            : part,
        ),
      }
  }
}
