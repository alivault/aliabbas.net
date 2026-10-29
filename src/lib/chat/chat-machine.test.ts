import { chatReducer, getActiveTurn, initialChatState } from './chat-machine'
import type { ChatEvent, ChatState } from './chat-machine'
import { describe, expect, it } from 'vite-plus/test'

const source = (id: string) => ({ id, title: id, body: `Body of ${id}` })

function play(
  events: ReadonlyArray<ChatEvent>,
  state: ChatState = initialChatState,
) {
  return events.reduce(chatReducer, state)
}

const ask = (turnId: string, attemptId: string, at = 0): ChatEvent => ({
  type: 'submit',
  turnId,
  attemptId,
  question: `Question ${turnId}`,
  at,
})

describe('chatReducer', () => {
  it('goes pending, streaming, complete', () => {
    let state = play([ask('t1', 'a1')])
    expect(state.turns[0]?.status).toBe('pending')
    state = play([{ type: 'delta', attemptId: 'a1', text: 'Hi', at: 5 }], state)
    expect(state.turns[0]).toMatchObject({
      status: 'streaming',
      answer: 'Hi',
      firstTokenAt: 5,
    })
    state = play([{ type: 'complete', attemptId: 'a1', at: 9 }], state)
    expect(state.turns[0]).toMatchObject({ status: 'complete', endedAt: 9 })
  })

  it('fails an answer that completes with no text', () => {
    const state = play([
      ask('t1', 'a1'),
      { type: 'complete', attemptId: 'a1', at: 1 },
    ])
    expect(state.turns[0]?.status).toBe('failed')
  })

  it('keeps the text that arrived when the answer stops', () => {
    const state = play([
      ask('t1', 'a1'),
      { type: 'delta', attemptId: 'a1', text: 'Part', at: 1 },
      { type: 'stop', at: 2 },
      { type: 'delta', attemptId: 'a1', text: ' late', at: 3 },
    ])
    expect(state.turns[0]).toMatchObject({ status: 'stopped', answer: 'Part' })
  })

  it('ignores events from an attempt that is not active', () => {
    const state = play([
      ask('t1', 'a1'),
      { type: 'retry', turnId: 't1', attemptId: 'a2', at: 1 }, // not allowed while active
      { type: 'stop', at: 1 },
      { type: 'retry', turnId: 't1', attemptId: 'a2', at: 2 },
      { type: 'delta', attemptId: 'a1', text: 'old', at: 3 },
      { type: 'delta', attemptId: 'a2', text: 'new', at: 4 },
    ])
    expect(state.turns).toHaveLength(1)
    expect(state.turns[0]).toMatchObject({ attemptId: 'a2', answer: 'new' })
  })

  it('stops the active turn when a new question comes', () => {
    const state = play([
      ask('t1', 'a1'),
      { type: 'delta', attemptId: 'a1', text: 'x', at: 1 },
      ask('t2', 'a2', 2),
    ])
    expect(state.turns.map((turn) => turn.status)).toEqual([
      'stopped',
      'pending',
    ])
    expect(getActiveTurn(state)?.id).toBe('t2')
  })

  it('adds each source once', () => {
    const state = play([
      ask('t1', 'a1'),
      { type: 'source', attemptId: 'a1', source: source('S1') },
      { type: 'source', attemptId: 'a1', source: source('S2') },
      { type: 'source', attemptId: 'a1', source: source('S1') },
    ])
    expect(state.turns[0]?.sources.map((item) => item.id)).toEqual(['S1', 'S2'])
  })

  it('removes only the last turn, and not while it streams', () => {
    let state = play([ask('t1', 'a1'), { type: 'remove', turnId: 't1' }])
    expect(state.turns).toHaveLength(1)
    state = play(
      [
        { type: 'fail', attemptId: 'a1', message: 'x', at: 1 },
        { type: 'remove', turnId: 't1' },
      ],
      state,
    )
    expect(state.turns).toHaveLength(0)
  })
})
