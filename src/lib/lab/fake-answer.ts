import type { ChatSource } from '~/lib/chat/protocol'

/**
 * Demo content for the /lab specimens. The sources describe the code of
 * this site's own chat, so every claim in the demo answer is true and
 * checkable in the repository. Nothing here is a fact about Ali.
 */

export const LAB_QUESTION = 'How does a streamed answer reach the screen?'

export const LAB_SOURCES: ReadonlyArray<ChatSource> = [
  {
    id: 'S1',
    title: 'Chat state machine',
    group: 'src/lib/chat/chat-machine.ts',
    body: 'Each question is a turn: pending, streaming, then complete, stopped or failed. Every stream event carries the attempt id it belongs to. The reducer ignores events for an attempt that is not active, so a late chunk from a stopped or retried request can never write into the wrong answer.',
  },
  {
    id: 'S2',
    title: 'Citation filter',
    group: 'src/lib/chat/citation-filter.ts',
    body: 'Tokens can split a marker, for example `[S` and `4]`. The filter holds back a tail that can still become a marker. A marker with an id that is not in the knowledge base is removed, so the client shows only citations that have evidence.',
  },
  {
    id: 'S3',
    title: 'Streaming markdown',
    group: 'src/lib/chat/streaming-markdown.ts',
    body: 'The renderer splits streaming markdown into blocks that each parse alone. Finished blocks keep the same text, so a memoized renderer parses only the last block again on each token.',
  },
  {
    id: 'S4',
    title: 'Stream protocol',
    group: 'src/lib/chat/protocol.ts',
    body: 'The server sends one JSON event per SSE frame: source, delta, done or error. A source event always arrives before the first delta that cites it, so the client never renders a citation without its evidence.',
  },
]

/**
 * The model output, with raw markers. The markers use the forms that the
 * citation filter accepts (`[S1]`, `[S2, S3]`), so the demo exercises the
 * real filter.
 */
export const LAB_ANSWER = `The answer arrives as a stream of small text events. Each event carries the attempt it belongs to, so text from a stopped answer cannot write into a new one [S1].

- A token can split a citation marker in two. A filter holds the tail back until the marker is complete [S2].
- The text is split into blocks. On each token, only the last block parses again [S3].
- A source always arrives before the first text that cites it. A chip never shows without its evidence [S4].

You can stop the answer at any time. The text that arrived stays on the screen, and the sources it cited stay with it [S1, S4].`
