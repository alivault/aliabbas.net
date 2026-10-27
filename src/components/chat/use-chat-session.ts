import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import {
  buildRequestMessages,
  chatReducer,
  getActiveTurn,
  initialChatState,
} from '~/lib/chat/chat-machine'
import type { HistoryMessage } from '~/lib/chat/chat-machine'
import { createSseParser, parseChatStreamEvent } from '~/lib/chat/protocol'

/** Time to wait for the first token, and between tokens after that. */
const FIRST_TOKEN_TIMEOUT_MS = 30_000
const STALL_TIMEOUT_MS = 20_000

type ConversationIdentity = { id: string; deleteToken: string }

type ActiveRequest = {
  attemptId: string
  controller: AbortController
  /** Write text that is waiting for the next frame into the answer now. */
  flush: () => void
}

function createRandomHex(byteLength: number) {
  const values = new Uint8Array(byteLength)
  globalThis.crypto.getRandomValues(values)
  return Array.from(values, (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('')
}

function createConversationIdentity(): ConversationIdentity {
  return {
    id: `conversation_${createRandomHex(12)}`,
    deleteToken: createRandomHex(24),
  }
}

function createId(prefix: string) {
  return `${prefix}_${createRandomHex(8)}`
}

async function readErrorMessage(response: Response) {
  const body: unknown = await response.json().catch(() => null)
  return body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof body.error === 'string'
    ? body.error
    : 'The assistant is unavailable right now. Please try again.'
}

/**
 * The chat session: the turn state machine plus the network side of each
 * attempt. Text that arrives between two frames goes into the answer in one
 * update per animation frame, so a fast stream costs at most one render per
 * frame.
 */
export function useChatSession() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)
  const [conversation] = useState(createConversationIdentity)
  const stateRef = useRef(state)
  const requestRef = useRef<ActiveRequest | null>(null)

  useLayoutEffect(() => {
    stateRef.current = state
  })

  useEffect(() => () => requestRef.current?.controller.abort(), [])

  const run = useCallback(
    async (attemptId: string, messages: Array<HistoryMessage>) => {
      requestRef.current?.controller.abort()
      const controller = new AbortController()

      let bufferedText = ''
      let bufferedAt = 0
      let frame = 0
      const flush = () => {
        if (frame) cancelAnimationFrame(frame)
        frame = 0
        if (!bufferedText) return
        dispatch({
          type: 'delta',
          attemptId,
          text: bufferedText,
          at: bufferedAt,
        })
        bufferedText = ''
      }
      const bufferText = (text: string) => {
        if (!bufferedText) bufferedAt = performance.now()
        bufferedText += text
        frame ||= requestAnimationFrame(flush)
      }

      let watchdog = 0
      let timedOut = false
      const armWatchdog = (ms: number, message: string) => {
        window.clearTimeout(watchdog)
        watchdog = window.setTimeout(() => {
          timedOut = true
          flush()
          dispatch({ type: 'fail', attemptId, message, at: performance.now() })
          controller.abort()
        }, ms)
      }

      const fail = (message: string) => {
        flush()
        dispatch({ type: 'fail', attemptId, message, at: performance.now() })
      }

      requestRef.current = { attemptId, controller, flush }
      armWatchdog(
        FIRST_TOKEN_TIMEOUT_MS,
        'The assistant took too long to start. Please try again.',
      )

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            conversation,
            requestId: attemptId,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          fail(await readErrorMessage(response))
          return
        }
        if (!response.body) {
          fail('The assistant returned an empty response.')
          return
        }

        const reader = response.body.getReader()
        const parser = createSseParser()
        let finished = false

        while (!finished) {
          const { done, value } = await reader.read()
          const frames = done ? parser.end() : parser.push(value)

          for (const data of frames) {
            const event = parseChatStreamEvent(data)
            if (!event) continue
            armWatchdog(
              STALL_TIMEOUT_MS,
              'The answer stalled. Please try again.',
            )

            if (event.type === 'delta') {
              bufferText(event.text)
            } else if (event.type === 'source') {
              // A source arrives before the text that cites it.
              flush()
              dispatch({ type: 'source', attemptId, source: event.source })
            } else if (event.type === 'done') {
              flush()
              dispatch({ type: 'complete', attemptId, at: performance.now() })
              finished = true
            } else {
              fail(event.message)
              finished = true
            }
          }

          if (done && !finished) {
            fail('The connection closed before the answer finished.')
            finished = true
          }
        }
        if (finished) await reader.cancel().catch(() => undefined)
      } catch (error) {
        // A stop or a timeout aborts the request. The reducer already has
        // the final state of this attempt.
        if (controller.signal.aborted || timedOut) return
        fail(
          typeof navigator !== 'undefined' && !navigator.onLine
            ? 'You are offline. Connect and try again.'
            : error instanceof Error && error.name !== 'TypeError'
              ? error.message
              : 'Could not reach the assistant. Please try again.',
        )
      } finally {
        window.clearTimeout(watchdog)
        if (frame) cancelAnimationFrame(frame)
        if (requestRef.current?.attemptId === attemptId) {
          requestRef.current = null
        }
      }
    },
    [conversation],
  )

  const send = useCallback(
    (input: string) => {
      const question = input.trim()
      if (!question) return false
      // Keep what the stopped answer received before this question.
      requestRef.current?.flush()
      requestRef.current?.controller.abort()

      const attemptId = createId('attempt')
      const messages = buildRequestMessages(stateRef.current.turns, question)
      dispatch({
        type: 'submit',
        turnId: createId('turn'),
        attemptId,
        question,
        at: performance.now(),
      })
      void run(attemptId, messages)
      return true
    },
    [run],
  )

  const stop = useCallback(() => {
    requestRef.current?.flush()
    requestRef.current?.controller.abort()
    dispatch({ type: 'stop', at: performance.now() })
  }, [])

  const retry = useCallback(
    (turnId: string) => {
      const turns = stateRef.current.turns
      const last = turns.at(-1)
      if (!last || last.id !== turnId || getActiveTurn(stateRef.current)) return
      const attemptId = createId('attempt')
      dispatch({ type: 'retry', turnId, attemptId, at: performance.now() })
      void run(
        attemptId,
        buildRequestMessages(turns.slice(0, -1), last.question),
      )
    },
    [run],
  )

  const remove = useCallback((turnId: string) => {
    dispatch({ type: 'remove', turnId })
  }, [])

  return {
    turns: state.turns,
    activeTurn: getActiveTurn(state),
    send,
    stop,
    retry,
    remove,
  }
}
