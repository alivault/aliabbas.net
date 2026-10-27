/**
 * The wire protocol between /api/chat and the chat client. The server sends
 * one JSON event per SSE `data:` frame. A `source` event always arrives
 * before the first `delta` that cites it, so the client never renders a
 * citation without its evidence.
 */

export type ChatSource = {
  id: string
  title: string
  group?: string
  body: string
  href?: string
}

export type ChatStreamEvent =
  | { type: 'source'; source: ChatSource }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

/** Citation markers in answer text, for example `[S4]`. */
export const CITATION_MARKER = /\[(S\d{1,3})\]/g

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isChatSource(value: unknown): value is ChatSource {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    (value.group === undefined || typeof value.group === 'string') &&
    (value.href === undefined || typeof value.href === 'string')
  )
}

/** Parse one SSE data payload. Returns null for frames the client must skip. */
export function parseChatStreamEvent(data: string): ChatStreamEvent | null {
  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    return null
  }
  if (!isRecord(payload)) return null

  switch (payload.type) {
    case 'delta':
      return typeof payload.text === 'string'
        ? { type: 'delta', text: payload.text }
        : null
    case 'source':
      return isChatSource(payload.source)
        ? { type: 'source', source: payload.source }
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

export function encodeChatStreamEvent(event: ChatStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Split a byte stream of SSE frames into `data:` payloads. Frames can arrive
 * split across chunks, so the parser keeps the incomplete tail.
 */
export function createSseParser() {
  const decoder = new TextDecoder()
  let buffer = ''

  const takeFrames = (final: boolean) => {
    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = final ? '' : (frames.pop() ?? '')
    return frames
      .map((frame) =>
        frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n'),
      )
      .filter((data) => data.length > 0)
  }

  return {
    push(chunk: Uint8Array) {
      buffer += decoder.decode(chunk, { stream: true })
      return takeFrames(false)
    },
    end() {
      buffer += decoder.decode()
      return takeFrames(true)
    },
  }
}
