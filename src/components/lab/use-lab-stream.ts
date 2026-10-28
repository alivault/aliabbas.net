import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  chatReducer,
  getActiveTurn,
  initialChatState,
} from '~/lib/chat/chat-machine'
import type { ChatEvent, ChatState, Turn } from '~/lib/chat/chat-machine'
import { LAB_QUESTION } from '~/lib/lab/fake-answer'
import {
  STREAM_PLANS,
  buildStreamSteps,
  playFakeStream,
} from '~/lib/lab/fake-stream'
import type { LabScenario, StreamPlan } from '~/lib/lab/fake-stream'

type LabEvent = ChatEvent | { type: 'reset'; state: ChatState }

function labReducer(state: ChatState, event: LabEvent): ChatState {
  return event.type === 'reset' ? event.state : chatReducer(state, event)
}

/** The machine states, plus `idle` for a specimen with no turn. */
export type LabMachineState = 'idle' | Turn['status']

const STEPS = buildStreamSteps()

/** A turn with the full answer, as if the stream had finished. */
function doneState(turnId: string, attemptId: string, at: number) {
  let state = chatReducer(initialChatState, {
    type: 'submit',
    turnId,
    attemptId,
    question: LAB_QUESTION,
    at,
  })
  for (const step of STEPS) {
    for (const event of step) {
      if (event.type === 'source') {
        state = chatReducer(state, {
          type: 'source',
          attemptId,
          source: event.source,
        })
      } else if (event.type === 'delta') {
        state = chatReducer(state, {
          type: 'delta',
          attemptId,
          text: event.text,
          at,
        })
      }
    }
  }
  return chatReducer(state, { type: 'complete', attemptId, at })
}

/**
 * One specimen's answer, driven by the real chat reducer and the fake
 * stream. Each specimen has its own instance, so they do not share state.
 */
export function useLabStream(initialScenario: LabScenario = 'done') {
  // The first render is the same on the server and the client: the empty
  // state or the full answer. A stream starts only on input.
  const [state, dispatch] = useReducer(labReducer, initialScenario, (first) =>
    first === 'done'
      ? doneState('lab-turn-0', 'lab-turn-0-a1', 0)
      : initialChatState,
  )
  const [scenario, setScenario] = useState<LabScenario>(initialScenario)
  const cancelRef = useRef<(() => void) | null>(null)
  const counterRef = useRef(0)

  const cancel = () => {
    cancelRef.current?.()
    cancelRef.current = null
  }

  const play = useCallback((plan: StreamPlan, attemptId: string) => {
    cancelRef.current = playFakeStream(
      plan,
      {
        onEvent: (event) => {
          const at = Date.now()
          switch (event.type) {
            case 'source':
              dispatch({ type: 'source', attemptId, source: event.source })
              return
            case 'delta':
              dispatch({ type: 'delta', attemptId, text: event.text, at })
              return
            case 'done':
              dispatch({ type: 'complete', attemptId, at })
              return
            case 'error':
              dispatch({
                type: 'fail',
                attemptId,
                message: event.message,
                at,
              })
              return
          }
        },
        onStop: () => dispatch({ type: 'stop', at: Date.now() }),
      },
      STEPS,
    )
  }, [])

  const run = useCallback(
    (next: LabScenario) => {
      cancel()
      setScenario(next)
      if (next === 'idle') {
        dispatch({ type: 'reset', state: initialChatState })
        return
      }

      counterRef.current += 1
      const turnId = `lab-turn-${counterRef.current}`
      const attemptId = `${turnId}-a1`
      const at = Date.now()

      if (next === 'done') {
        dispatch({ type: 'reset', state: doneState(turnId, attemptId, at) })
        return
      }

      dispatch({ type: 'reset', state: initialChatState })
      dispatch({
        type: 'submit',
        turnId,
        attemptId,
        question: LAB_QUESTION,
        at,
      })
      play(STREAM_PLANS[next], attemptId)
    },
    [play],
  )

  const stop = useCallback(() => {
    cancel()
    dispatch({ type: 'stop', at: Date.now() })
  }, [])

  /** Start the turn again with a normal stream. */
  const retry = useCallback(
    (turnId: string) => {
      cancel()
      counterRef.current += 1
      const attemptId = `${turnId}-a${counterRef.current}`
      dispatch({ type: 'retry', turnId, attemptId, at: Date.now() })
      play(STREAM_PLANS.streaming, attemptId)
    },
    [play],
  )

  useEffect(() => cancel, [])

  const turn = state.turns.at(-1)
  const machineState: LabMachineState = turn ? turn.status : 'idle'

  return {
    turn,
    machineState,
    isActive: getActiveTurn(state) !== undefined,
    scenario,
    run,
    stop,
    retry,
  }
}

export type LabStream = ReturnType<typeof useLabStream>
