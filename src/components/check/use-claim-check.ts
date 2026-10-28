import { useCallback, useEffect, useReducer, useRef } from 'react'
import { createSseParser } from '~/lib/chat/protocol'
import { checkReducer, initialCheckState } from '~/lib/check/check-machine'
import { parseCheckStreamEvent } from '~/lib/check/protocol'

/** Time to wait for the next event. The split and each grade are one model call. */
const STALL_TIMEOUT_MS = 40_000

function createId() {
  const values = new Uint8Array(8)
  globalThis.crypto.getRandomValues(values)
  return `check_${Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('')}`
}

async function readErrorMessage(response: Response) {
  const body: unknown = await response.json().catch(() => null)
  return body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof body.error === 'string'
    ? body.error
    : 'The checker is unavailable right now. Please try again.'
}

/** The claim check state machine plus the network side of each attempt. */
export function useClaimCheck() {
  const [state, dispatch] = useReducer(checkReducer, initialCheckState)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const check = useCallback(async (input: string) => {
    const claim = input.trim()
    if (!claim) return false
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const attemptId = createId()
    const now = () => performance.now()
    dispatch({ type: 'submit', attemptId, claim, at: now() })

    let watchdog = 0
    let timedOut = false
    const fail = (message: string) =>
      dispatch({ type: 'fail', attemptId, message, at: now() })
    const armWatchdog = () => {
      window.clearTimeout(watchdog)
      watchdog = window.setTimeout(() => {
        timedOut = true
        fail('The check took too long. Please try again.')
        controller.abort()
      }, STALL_TIMEOUT_MS)
    }

    void (async () => {
      armWatchdog()
      try {
        const response = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim, requestId: attemptId }),
          signal: controller.signal,
        })
        if (!response.ok) return fail(await readErrorMessage(response))
        if (!response.body) return fail('The checker returned nothing.')

        const reader = response.body.getReader()
        const parser = createSseParser()
        let finished = false
        while (!finished) {
          const { done, value } = await reader.read()
          for (const data of done ? parser.end() : parser.push(value)) {
            const event = parseCheckStreamEvent(data)
            if (!event) continue
            armWatchdog()
            switch (event.type) {
              case 'parts':
                dispatch({ type: 'parts', attemptId, parts: event.parts })
                break
              case 'source':
                dispatch({ type: 'source', attemptId, source: event.source })
                break
              case 'grade':
                dispatch({
                  type: 'grade',
                  attemptId,
                  partId: event.partId,
                  grade: event.grade,
                })
                break
              case 'part-error':
                dispatch({
                  type: 'part-error',
                  attemptId,
                  partId: event.partId,
                  message: event.message,
                })
                break
              case 'done':
                dispatch({ type: 'done', attemptId, at: now() })
                finished = true
                break
              case 'error':
                fail(event.message)
                finished = true
                break
            }
          }
          if (done && !finished) {
            fail('The connection closed before the check finished.')
            finished = true
          }
        }
        await reader.cancel().catch(() => undefined)
      } catch (error) {
        // A stop or a timeout aborts the request; the reducer has the state.
        if (controller.signal.aborted || timedOut) return
        fail(
          !navigator.onLine
            ? 'You are offline. Connect and try again.'
            : error instanceof Error && error.name !== 'TypeError'
              ? error.message
              : 'Could not reach the checker. Please try again.',
        )
      } finally {
        window.clearTimeout(watchdog)
        if (controllerRef.current === controller) controllerRef.current = null
      }
    })()
    return true
  }, [])

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    dispatch({ type: 'stop', at: performance.now() })
  }, [])

  return { state, check, stop }
}
