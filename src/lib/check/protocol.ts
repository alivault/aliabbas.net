import type { ChatSource } from '~/lib/chat/protocol'
import { isVerdict } from './verdicts'
import type { EvidenceQuote, Grade } from './evidence'

/**
 * The wire protocol between /api/check and the checker. One JSON event per
 * SSE `data:` frame:
 *
 *   parts → (source* grade | part-error)* per part, in any order → done
 *
 * `error` can end the stream at any point. A `source` event always arrives
 * before the first grade that quotes it.
 */

export type ClaimPart = { id: string; text: string }

export type CheckStreamEvent =
  | { type: 'parts'; parts: Array<ClaimPart> }
  | { type: 'source'; source: ChatSource }
  | { type: 'grade'; partId: string; grade: Grade }
  | { type: 'part-error'; partId: string; message: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export const MAX_CLAIM_LENGTH = 300
export const MAX_PARTS = 4

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPart(value: unknown): value is ClaimPart {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string'
  )
}

function isSource(value: unknown): value is ChatSource {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string'
  )
}

function isQuote(value: unknown): value is EvidenceQuote {
  return (
    isRecord(value) &&
    typeof value.sourceId === 'string' &&
    typeof value.quote === 'string'
  )
}

function isGrade(value: unknown): value is Grade {
  return (
    isRecord(value) &&
    isVerdict(value.verdict) &&
    typeof value.reason === 'string' &&
    typeof value.downgraded === 'boolean' &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isQuote)
  )
}

/** Parse one SSE data payload. Returns null for frames the client must skip. */
export function parseCheckStreamEvent(data: string): CheckStreamEvent | null {
  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    return null
  }
  if (!isRecord(payload)) return null

  switch (payload.type) {
    case 'parts':
      return Array.isArray(payload.parts) && payload.parts.every(isPart)
        ? { type: 'parts', parts: payload.parts }
        : null
    case 'source':
      return isSource(payload.source)
        ? { type: 'source', source: payload.source }
        : null
    case 'grade':
      return typeof payload.partId === 'string' && isGrade(payload.grade)
        ? { type: 'grade', partId: payload.partId, grade: payload.grade }
        : null
    case 'part-error':
      return typeof payload.partId === 'string' &&
        typeof payload.message === 'string'
        ? {
            type: 'part-error',
            partId: payload.partId,
            message: payload.message,
          }
        : null
    case 'done':
      return { type: 'done' }
    case 'error':
      return typeof payload.message === 'string'
        ? { type: 'error', message: payload.message }
        : null
    default:
      return null
  }
}

export function encodeCheckStreamEvent(event: CheckStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`
}
