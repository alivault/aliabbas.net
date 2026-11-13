import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import {
  AnswerMarkdown,
  CitationContext,
} from '~/components/chat/AnswerMarkdown'
import type { CitationContextValue } from '~/components/chat/AnswerMarkdown'
import { useSharedChatSession } from '~/components/chat/ChatSessionProvider'
import {
  SourceCard,
  evidenceSourceElementId,
} from '~/components/chat/EvidencePanel'
import { announcementFor } from '~/lib/chat/announce'
import { isActive } from '~/lib/chat/chat-machine'
import type { Turn } from '~/lib/chat/chat-machine'
import { revealSource } from '~/lib/chat/reveal-source'
import { answerToPlainText } from '~/lib/chat/streaming-markdown'
import { DURATIONS, EASE_OUT } from '~/lib/design/motion'
import { play } from '~/lib/sound'
import { cn } from '~/lib/utils'
import {
  Line,
  Reader,
  ReaderList,
  ReaderText,
  ReaderTitle,
  hudText,
} from './Reader'

const STARTERS = [
  'What does Ali build?',
  'How does Pico survive a crash?',
  'Which roles is Ali looking for?',
  'How does his design background shape his engineering?',
]

const SOURCE_PREFIX = 'chat'

type Pick = { turnId: string; sourceId: string }

/** A small action under an answer, in the HUD face. */
const actionStyle = cn(hudText, 'hud-fill uppercase')

/**
 * The chat as a reader. Questions show in the HUD face; answers in the body
 * face, as markdown with a numbered chip for each citation. A chip opens
 * its source in the list under the answer. Links to pages of this site go
 * through the router, and the conversation lives above the pages, so it
 * is still here after a visit to a cited page.
 */
export default function ChatReader() {
  const { turns, activeTurn, send, stop, retry, remove, draft, setDraft } =
    useSharedChatSession()
  const field = useRef<HTMLTextAreaElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const [picked, setPicked] = useState<Pick | null>(null)
  const [hovered, setHovered] = useState<Pick | null>(null)
  /** The chip that opened a source, for Esc in the list to go back to. */
  const trigger = useRef<HTMLElement | null>(null)
  const streaming = activeTurn !== undefined
  /** Follow the newest answer, unless the visitor scrolled up to read. */
  const following = useRef(true)

  const submit = (question: string) => {
    if (!send(question)) return
    setDraft('')
    setPicked(null)
    following.current = true
  }

  const focusField = () =>
    requestAnimationFrame(() => {
      const element = field.current
      if (!element) return
      element.focus()
      element.setSelectionRange(element.value.length, element.value.length)
    })

  const pickedRef = useRef(picked)
  pickedRef.current = picked

  const cite = useCallback((turnId: string, sourceId: string) => {
    // A second click on the open source closes it; focus stays on the chip.
    const current = pickedRef.current
    if (current?.turnId === turnId && current.sourceId === sourceId) {
      setPicked(null)
      return
    }
    setPicked({ turnId, sourceId })
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    // The card opens in this render; focus and show it in the next frame.
    requestAnimationFrame(() => {
      const card = document.getElementById(
        evidenceSourceElementId(`${SOURCE_PREFIX}-${turnId}`, sourceId),
      )
      if (!card) return
      card.focus({ preventScroll: true })
      requestAnimationFrame(() => revealSource(card))
    })
  }, [])

  const hover = useCallback((turnId: string, sourceId: string | null) => {
    setHovered(sourceId ? { turnId, sourceId } : null)
  }, [])

  const select = useCallback((turnId: string, sourceId: string | null) => {
    setPicked(sourceId ? { turnId, sourceId } : null)
  }, [])

  const onRetry = useCallback(
    (turnId: string) => {
      retry(turnId)
      setPicked(null)
      following.current = true
    },
    [retry],
  )

  const onEdit = useCallback(
    (turn: Turn) => {
      remove(turn.id)
      setDraft(turn.question)
      setPicked(null)
      focusField()
    },
    [remove, setDraft],
  )

  const onStop = useCallback(() => {
    play('click')
    stop()
  }, [stop])

  /** Esc in the sources goes back to the chip that opened one. */
  const backToChip = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !trigger.current?.isConnected) return
    event.preventDefault()
    trigger.current.focus()
  }, [])

  // Esc stops the answer. It runs before the Esc of the world (which waits
  // a tick and skips a handled key), so the reader stays open.
  useEffect(() => {
    if (!streaming) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      stop()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [streaming, stop])

  useEffect(() => {
    const onScroll = () => {
      const bottom = window.scrollY + window.innerHeight
      following.current = bottom >= document.documentElement.scrollHeight - 160
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const last = turns.at(-1)
  const progress = `${turns.length}:${last?.answer.length ?? 0}:${last?.sources.length ?? 0}:${last?.status}`
  useEffect(() => {
    if (turns.length && following.current) {
      end.current?.scrollIntoView({ block: 'end' })
    }
  }, [progress, turns.length])

  const asked = new Set(turns.map((turn) => turn.question.trim().toLowerCase()))
  const starters = STARTERS.filter(
    (question) => !asked.has(question.toLowerCase()),
  )
  const starterList = (
    <ReaderList
      items={starters.map((question) => (
        <button
          key={question}
          type="button"
          data-sound="send"
          onClick={() => submit(question)}
          className="hud-fill decoration-hud/50 text-left uppercase underline underline-offset-[10px]"
        >
          {question}
        </button>
      ))}
      className="mt-10 flex flex-col gap-3"
    />
  )

  return (
    <Reader>
      <ReaderTitle>Ask about Ali</ReaderTitle>
      <ReaderText>
        An AI that answers from Ali’s public record: his work, his notes and his
        experience. Each claim links to its source.
      </ReaderText>
      {turns.length === 0 ? starterList : null}

      <p role="status" aria-live="polite" className="sr-only">
        {announcementFor(last)}
      </p>

      <div className="mt-12 flex flex-col gap-16">
        {turns.map((turn, index) => (
          <TurnView
            key={turn.id}
            turn={turn}
            isLast={index === turns.length - 1}
            picked={picked?.turnId === turn.id ? picked.sourceId : null}
            hovered={hovered?.turnId === turn.id ? hovered.sourceId : null}
            onCite={cite}
            onHover={hover}
            onSelect={select}
            onStop={onStop}
            onRetry={onRetry}
            onEdit={onEdit}
            onSourcesKeyDown={backToChip}
          />
        ))}
      </div>

      <Line className="mt-14">
        <Composer
          fieldRef={field}
          value={draft}
          streaming={streaming}
          onChange={setDraft}
          onSubmit={() => submit(draft)}
          onStop={onStop}
        />
      </Line>
      {turns.length > 0 && !streaming && starters.length > 0 ? (
        <div className="mt-6">
          <p className={cn(hudText, 'text-hud/70 text-xs')}>Try asking</p>
          {starterList}
        </div>
      ) : null}
      <div ref={end} />
    </Reader>
  )
}

/**
 * The field to ask. Enter sends, Shift+Enter adds a line. While an answer
 * streams, the button stops it; with a new question typed, it sends that
 * one, which stops the answer first.
 */
function Composer({
  fieldRef,
  value,
  streaming,
  onChange,
  onSubmit,
  onStop,
}: {
  fieldRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  streaming: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
}) {
  const hasDraft = value.trim().length > 0
  const showStop = streaming && !hasDraft
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (hasDraft) onSubmit()
      }}
      className={cn(hudText, 'flex max-w-[60ch] items-end gap-8')}
    >
      <label htmlFor="chat-question" className="sr-only">
        Ask about Ali
      </label>
      <textarea
        ref={fieldRef}
        id="chat-question"
        value={value}
        rows={1}
        maxLength={1000}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault()
            if (hasDraft) onSubmit()
          }
        }}
        placeholder={streaming ? 'Ask something else' : 'Type here'}
        autoComplete="off"
        className="border-hud/40 focus:border-hud placeholder:text-hud/45 field-sizing-content max-h-48 min-w-0 flex-1 resize-none border-b bg-transparent py-2 tracking-[0.42em] uppercase outline-none"
      />
      <button
        type={showStop ? 'button' : 'submit'}
        data-sound={showStop ? 'none' : 'send'}
        onClick={showStop ? onStop : undefined}
        disabled={!showStop && !hasDraft}
        aria-label={
          showStop
            ? 'Stop the answer'
            : streaming
              ? 'Stop the answer and send'
              : 'Send'
        }
        className="hud-fill mb-2 uppercase disabled:opacity-50"
      >
        {showStop ? 'Stop' : 'Send'}
      </button>
    </form>
  )
}

function formatDuration(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

/** What happened to the answer, under it. */
function statusOf(turn: Turn) {
  if (turn.status === 'stopped') {
    return turn.answer ? 'Stopped' : 'Stopped before the answer started'
  }
  if (turn.status !== 'complete') return ''
  const metrics =
    turn.firstTokenAt !== undefined && turn.endedAt !== undefined
      ? `First token ${formatDuration(turn.firstTokenAt - turn.startedAt)} · done in ${formatDuration(turn.endedAt - turn.startedAt)}`
      : ''
  if (turn.sources.length === 0) {
    return ['No sources cited. Treat it as unverified', metrics]
      .filter(Boolean)
      .join(' · ')
  }
  return metrics
}

function CopyAnswer({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timeout)
  }, [copied])
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          .writeText(text)
          .then(() => setCopied(true))
          .catch(() => undefined)
      }}
      className={actionStyle}
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

const TurnView = memo(function TurnView({
  turn,
  isLast,
  picked,
  hovered,
  onCite,
  onHover,
  onSelect,
  onStop,
  onRetry,
  onEdit,
  onSourcesKeyDown,
}: {
  turn: Turn
  isLast: boolean
  picked: string | null
  hovered: string | null
  onCite: (turnId: string, sourceId: string) => void
  onHover: (turnId: string, sourceId: string | null) => void
  onSelect: (turnId: string, sourceId: string | null) => void
  onStop: () => void
  onRetry: (turnId: string) => void
  onEdit: (turn: Turn) => void
  onSourcesKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}) {
  const active = isActive(turn)
  const questionId = `${turn.id}-question`
  const prefix = `${SOURCE_PREFIX}-${turn.id}`

  const citations = useMemo<CitationContextValue>(() => {
    const numbers = new Map(
      turn.sources.map((source, index) => [source.id, index + 1]),
    )
    const byId = new Map(turn.sources.map((source) => [source.id, source]))
    return {
      sourceNumber: (id) => numbers.get(id),
      getSource: (id) => byId.get(id),
      activeSourceId: picked,
      hoveredSourceId: hovered,
      animateIn: active,
      // The list under the answer can be out of view, so a chip previews
      // its source on hover.
      preview: true,
      onCite: (id) => onCite(turn.id, id),
      onHover: (id) => onHover(turn.id, id),
    }
  }, [turn.id, turn.sources, picked, hovered, active, onCite, onHover])

  const copyText = useMemo(() => {
    if (active || !turn.answer) return ''
    const plain = answerToPlainText(turn.answer, citations.sourceNumber)
    const sources = turn.sources
      .map(
        (source, index) =>
          `[${index + 1}] ${source.title}${source.href ? ` — ${source.href}` : ''}`,
      )
      .join('\n')
    return sources ? `${plain}\n\nSources:\n${sources}` : plain
  }, [active, turn.answer, turn.sources, citations])

  const status = statusOf(turn)
  const count = turn.sources.length

  return (
    <motion.article
      data-turn
      aria-labelledby={questionId}
      aria-busy={active}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
    >
      <h2 id={questionId} className={cn(hudText, 'whitespace-pre-line')}>
        {turn.question}
      </h2>

      {turn.answer ? (
        <CitationContext value={citations}>
          <AnswerMarkdown
            text={turn.answer}
            className={cn(
              'mt-4 max-w-[60ch] text-base leading-7',
              turn.status === 'stopped' || turn.status === 'failed'
                ? 'text-fg-muted'
                : 'text-fg-secondary',
            )}
          />
        </CitationContext>
      ) : null}
      {turn.status === 'pending' ? (
        <p className={cn(hudText, 'mt-4 animate-pulse')}>Thinking</p>
      ) : null}
      {turn.status === 'failed' ? (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {turn.error ?? 'The answer failed. Try again.'}
        </p>
      ) : null}
      {status ? (
        <p className="text-fg-muted mt-4 text-sm tabular-nums">{status}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-10 gap-y-2">
        {active ? (
          <button
            type="button"
            data-sound="none"
            onClick={onStop}
            className={actionStyle}
          >
            Stop
          </button>
        ) : null}
        {copyText ? <CopyAnswer text={copyText} /> : null}
        {isLast && !active ? (
          <button
            type="button"
            data-sound="send"
            onClick={() => onRetry(turn.id)}
            className={actionStyle}
          >
            {turn.status === 'complete' ? 'Regenerate' : 'Retry'}
          </button>
        ) : null}
        {isLast && (turn.status === 'failed' || turn.status === 'stopped') ? (
          <button
            type="button"
            onClick={() => onEdit(turn)}
            className={actionStyle}
          >
            Edit question
          </button>
        ) : null}
      </div>

      {count > 0 ? (
        <section
          aria-label={`Sources for: ${turn.question}`}
          onKeyDown={onSourcesKeyDown}
          className="mt-8 max-w-[60ch]"
        >
          <h3 className={cn(hudText, 'text-hud/70 text-xs')}>
            {count} {count === 1 ? 'source' : 'sources'}
            {active ? ' so far' : ''}
          </h3>
          <ol className="mt-3 space-y-3">
            <LayoutGroup id={prefix}>
              {turn.sources.map((source, index) => (
                <SourceCard
                  key={`${turn.attemptId}-${source.id}`}
                  source={source}
                  number={index + 1}
                  idPrefix={prefix}
                  active={picked === source.id}
                  hovered={hovered === source.id}
                  onHover={(id) => onHover(turn.id, id)}
                  onSelect={(id) => onSelect(turn.id, id)}
                />
              ))}
            </LayoutGroup>
          </ol>
        </section>
      ) : null}
    </motion.article>
  )
})
