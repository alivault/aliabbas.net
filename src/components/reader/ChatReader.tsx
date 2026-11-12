import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useChatSession } from '~/components/chat/use-chat-session'
import {
  listenForQuestions,
  takePendingQuestion,
} from '~/components/world/store'
import { answerToPlainText } from '~/lib/chat/streaming-markdown'
import { DURATIONS, EASE_OUT } from '~/lib/design/motion'
import { play } from '~/lib/sound'
import { cn } from '~/lib/utils'
import type { Turn } from '~/lib/chat/chat-machine'
import {
  Reader,
  ReaderExternal,
  ReaderList,
  ReaderText,
  ReaderTitle,
  hudText,
} from './Reader'

const STARTERS = [
  'What does Ali build?',
  'How does Pico survive a crash?',
  'Which roles is Ali looking for?',
]

/**
 * The chat as a reader. The visitor asks in the field of the HUD (bottom
 * right). Questions show in the HUD face, answers in the body face, with
 * their sources under them.
 */
export default function ChatReader() {
  const { turns, activeTurn, send, stop } = useChatSession()
  const end = useRef<HTMLDivElement>(null)

  // Questions from the HUD field, and one typed before this page opened.
  useEffect(() => {
    const pending = takePendingQuestion()
    if (pending) send(pending)
    return listenForQuestions((question) => {
      send(question)
    })
  }, [send])

  // Keep the newest answer in view while it streams.
  const lastLength = turns.at(-1)?.answer.length ?? 0
  useEffect(() => {
    if (turns.length) end.current?.scrollIntoView({ block: 'end' })
  }, [turns.length, lastLength])

  return (
    <Reader>
      <ReaderTitle>Ask about Ali</ReaderTitle>
      <ReaderText>
        An AI that answers from Ali’s public record: his work, his notes and his
        experience. It cites its sources. Type in the field at the bottom right.
      </ReaderText>
      {turns.length === 0 ? (
        <ReaderList
          items={STARTERS.map((question) => (
            <button
              key={question}
              type="button"
              data-sound="send"
              onClick={() => send(question)}
              className="decoration-hud/50 hover:decoration-hud text-left uppercase underline underline-offset-[10px]"
            >
              {question}
            </button>
          ))}
          className="mt-10 flex flex-col gap-3"
        />
      ) : null}

      <div aria-live="polite" className="mt-12 flex flex-col gap-14">
        {turns.map((turn) => (
          <TurnView
            key={turn.id}
            turn={turn}
            active={turn.id === activeTurn?.id}
            onStop={() => {
              play('click')
              stop()
            }}
          />
        ))}
      </div>
      <div ref={end} />
    </Reader>
  )
}

function TurnView({
  turn,
  active,
  onStop,
}: {
  turn: Turn
  active: boolean
  onStop: () => void
}) {
  const number = (id: string) => {
    const index = turn.sources.findIndex((source) => source.id === id)
    return index === -1 ? undefined : index + 1
  }
  const paragraphs = answerToPlainText(turn.answer, number)
    .split(/\n{2,}/)
    .filter(Boolean)

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
    >
      <h2 className={hudText}>{turn.question}</h2>
      {paragraphs.map((text, index) => (
        <p
          key={index}
          className="text-fg-secondary mt-4 max-w-[60ch] text-base leading-7 whitespace-pre-line"
        >
          {text}
        </p>
      ))}
      {turn.status === 'pending' ? (
        <p className={cn(hudText, 'mt-4 animate-pulse')}>Thinking</p>
      ) : null}
      {turn.status === 'failed' ? (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {turn.error ?? 'The answer failed. Try again.'}
        </p>
      ) : null}
      {active ? (
        <button
          type="button"
          data-sound="none"
          onClick={onStop}
          className={cn(hudText, 'mt-4 uppercase opacity-70 hover:opacity-100')}
        >
          Stop
        </button>
      ) : null}
      {turn.sources.length && !active ? (
        <ol className={cn(hudText, 'mt-6 opacity-80')}>
          {turn.sources.map((source, index) => (
            <li key={source.id}>
              [{index + 1}]{' '}
              {source.href ? (
                <ReaderExternal href={source.href}>
                  {source.title}
                </ReaderExternal>
              ) : (
                source.title
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </motion.article>
  )
}
