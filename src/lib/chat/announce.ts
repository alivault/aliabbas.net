import type { Turn } from './chat-machine'
import { answerToPlainText } from './streaming-markdown'

/** What the screen reader hears when the last turn changes state. */
export function announcementFor(turn: Turn | undefined) {
  if (!turn) return ''
  switch (turn.status) {
    case 'pending':
    case 'streaming':
      return 'Generating answer.'
    case 'stopped':
      return 'Answer stopped.'
    case 'failed':
      // The turn shows the error with role="alert".
      return ''
    case 'complete': {
      const count = turn.sources.length
      const numbers = new Map(turn.sources.map((s, i) => [s.id, i + 1]))
      const sources =
        count === 0
          ? 'It cites no sources.'
          : `It cites ${count} ${count === 1 ? 'source' : 'sources'}.`
      return `Answer ready. ${sources} ${answerToPlainText(turn.answer, (id) => numbers.get(id))}`
    }
  }
}
