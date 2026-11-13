import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LayoutGroup, motion } from 'motion/react'
import {
  AnswerMarkdown,
  CitationContext,
} from '~/components/chat/AnswerMarkdown'
import type { CitationContextValue } from '~/components/chat/AnswerMarkdown'
import { useSharedChatSession } from '~/components/chat/ChatSessionProvider'
import { useCheckSession } from '~/components/check/CheckSessionProvider'
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
import Shimmer from '~/components/ui/shimmer'
import ReaderComposer from './ReaderComposer'
import type { ComposerLabels } from './ReaderComposer'
import {
  Reader,
  ReaderLink,
  ReaderLinks,
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

const SOURCE_PREFIX = 'chat-evidence'

const DESKTOP = '(min-width: 1024px)'

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** True on a wide screen, where the evidence is a sidebar beside the text. */
function useDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  )
}

/** Renders into the body, after the first render in the browser. */
function Portal({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return ready ? createPortal(children, document.body) : null
}

const CHAT_LABELS: ComposerLabels = {
  field: 'Ask about Ali',
  placeholder: 'Type here',
  busyPlaceholder: 'Ask something else',
  submit: 'Send',
  stop: 'Stop the answer',
  stopAndSubmit: 'Stop the answer and send',
  submitHint: 'send',
}

type Pick = { turnId: string; sourceId: string }

/** A small action under an answer, in the HUD face. */
const actionStyle = cn(hudText, 'hud-fill uppercase')

/**
 * The chat as a reader. Questions show in the HUD face; answers in the body
 * face, as markdown with a numbered chip for each citation. The field to
 * ask stays at the bottom of the screen. The evidence is a sidebar on the
 * right, over the orb, with a blur: a chip opens its source there. Links
 * to pages of this site go through the router, and the conversation lives
 * above the pages, so it is still here after a visit to a cited page.
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
  const lastClaim = useCheckSession().state.claim
  /** Follow the newest answer, unless the visitor scrolled up to read. */
  const following = useRef(true)
  const desktop = useDesktop()
  /** The answer that the evidence shows: null for the latest one. */
  const [shownTurnId, setShownTurnId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  /** The visitor closed the sidebar: it does not open again by itself. */
  const closedByVisitor = useRef(false)
  const lastTurn = turns.at(-1)
  const shownTurn = turns.find((turn) => turn.id === shownTurnId) ?? lastTurn
  const panelShows = (turnId: string) => panelOpen && shownTurn?.id === turnId

  const submit = (question: string) => {
    if (!send(question)) return
    setDraft('')
    setPicked(null)
    setShownTurnId(null)
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

  const shownRef = useRef({ panelOpen, shownTurnId: shownTurn?.id })
  shownRef.current = { panelOpen, shownTurnId: shownTurn?.id }

  /** Focus and show a card of the sidebar, once it is on the page. */
  const showCard = (sourceId: string) => {
    let tries = 0
    const attempt = () => {
      const card = document.getElementById(
        evidenceSourceElementId(SOURCE_PREFIX, sourceId),
      )
      if (card) {
        card.focus({ preventScroll: true })
        requestAnimationFrame(() => revealSource(card))
      } else if (++tries < 30) requestAnimationFrame(attempt)
    }
    requestAnimationFrame(attempt)
  }

  const cite = useCallback(
    (turnId: string, sourceId: string) => {
      // A second click on the source that the sidebar shows closes it;
      // focus stays on the chip.
      const current = pickedRef.current
      const shown = shownRef.current
      if (
        shown.panelOpen &&
        shown.shownTurnId === turnId &&
        current?.turnId === turnId &&
        current.sourceId === sourceId
      ) {
        setPicked(null)
        return
      }
      setPicked({ turnId, sourceId })
      setShownTurnId(turnId === lastTurn?.id ? null : turnId)
      setPanelOpen(true)
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      showCard(sourceId)
    },
    [lastTurn?.id],
  )

  /** The sources button under an answer: show or hide its evidence. */
  const toggleEvidence = useCallback(
    (turnId: string) => {
      const shown = shownRef.current
      if (shown.panelOpen && shown.shownTurnId === turnId) {
        setPanelOpen(false)
        closedByVisitor.current = true
        return
      }
      trigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      setShownTurnId(turnId === lastTurn?.id ? null : turnId)
      setPicked(null)
      setPanelOpen(true)
    },
    [lastTurn?.id],
  )

  const closePanel = useCallback(() => {
    setPanelOpen(false)
    closedByVisitor.current = true
    if (trigger.current?.isConnected) trigger.current.focus()
  }, [])

  // On a wide screen, the sidebar opens by itself with the first sources,
  // unless the visitor closed it.
  const hasSources = (lastTurn?.sources.length ?? 0) > 0
  useEffect(() => {
    if (desktop && hasSources && !closedByVisitor.current) setPanelOpen(true)
  }, [desktop, hasSources])

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

  /**
   * Esc in the sidebar goes back to the chip or the button that opened it.
   * On a phone, where it covers the answer, it also closes.
   */
  const onPanelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (!desktop) {
        closePanel()
        return
      }
      if (trigger.current?.isConnected) trigger.current.focus()
    },
    [desktop, closePanel],
  )

  // The field at the bottom of the screen: the page fades out above it,
  // and the text can scroll up past it.
  const composerBox = useRef<HTMLDivElement>(null)
  const [composerHeight, setComposerHeight] = useState(96)
  useEffect(() => {
    const box = composerBox.current
    if (!box) return
    const root = document.documentElement
    const measure = () => {
      setComposerHeight(box.offsetHeight)
      root.style.setProperty('--page-fade-bottom', `${box.offsetHeight + 24}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--page-fade-bottom')
    }
  })

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
      <ReaderTitle>Ask AI about Ali</ReaderTitle>
      <ReaderText>
        An AI that answers from Ali’s public record: his work, his notes and his
        experience. Each claim links to its source.
      </ReaderText>
      <ReaderLinks>
        <ReaderLink to="/check" search={lastClaim ? { claim: lastClaim } : {}}>
          Check a claim instead
        </ReaderLink>
      </ReaderLinks>
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
            evidenceShown={panelShows(turn.id)}
            onCite={cite}
            onHover={hover}
            onStop={onStop}
            onRetry={onRetry}
            onEdit={onEdit}
            onToggleEvidence={toggleEvidence}
          />
        ))}
      </div>

      {turns.length > 0 && !streaming && starters.length > 0 ? (
        <div className="mt-14">
          <p className={cn(hudText, 'text-hud/70 text-xs')}>Try asking</p>
          {starterList}
        </div>
      ) : null}
      {/* Room to scroll the end of the text up past the field. */}
      <div aria-hidden="true" style={{ height: composerHeight }} />
      <div ref={end} />

      <Portal>
        <motion.div
          ref={composerBox}
          data-hud
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
          // Clear of the sound button at the bottom left, and as wide as
          // the text on a wide screen.
          className="fixed bottom-0 left-0 z-[14] w-full pt-3 pr-6 pb-5 pl-16 sm:pr-16 lg:left-[var(--frame-inset)] lg:w-[var(--reader-width)]"
        >
          <ReaderComposer
            id="chat-question"
            fieldRef={field}
            labels={CHAT_LABELS}
            value={draft}
            busy={streaming}
            onChange={setDraft}
            onSubmit={() => submit(draft)}
            onStop={onStop}
          />
        </motion.div>
        {panelOpen && shownTurn ? (
          <EvidenceSidebar
            turn={shownTurn}
            pinned={shownTurn !== lastTurn}
            index={turns.indexOf(shownTurn) + 1}
            total={turns.length}
            desktop={desktop}
            picked={picked?.turnId === shownTurn.id ? picked.sourceId : null}
            hovered={hovered?.turnId === shownTurn.id ? hovered.sourceId : null}
            onHover={(id) => hover(shownTurn.id, id)}
            onSelect={(id) => select(shownTurn.id, id)}
            onShowLatest={() => {
              setShownTurnId(null)
              setPicked(null)
            }}
            onClose={closePanel}
            onKeyDown={onPanelKeyDown}
          />
        ) : null}
      </Portal>
    </Reader>
  )
}

/**
 * The sources of one answer, in a panel that floats beside the text with
 * a blur, so the orb shows through behind it. On a phone it covers the screen.
 */
function EvidenceSidebar({
  turn,
  pinned,
  index,
  total,
  desktop,
  picked,
  hovered,
  onHover,
  onSelect,
  onShowLatest,
  onClose,
  onKeyDown,
}: {
  turn: Turn
  pinned: boolean
  index: number
  total: number
  desktop: boolean
  picked: string | null
  hovered: string | null
  onHover: (sourceId: string | null) => void
  onSelect: (sourceId: string | null) => void
  onShowLatest: () => void
  onClose: () => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}) {
  const count = turn.sources.length
  const active = isActive(turn)
  return (
    <motion.aside
      aria-label="Evidence"
      role={desktop ? undefined : 'dialog'}
      aria-modal={desktop ? undefined : true}
      data-hud
      onKeyDown={onKeyDown}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
      // On a phone it covers the screen. On a wide screen it floats right
      // beside the text, 32px from it, as a second column, under the HUD,
      // and is as tall as its sources need.
      className="border-hud/20 bg-background/45 fixed inset-0 z-[15] flex flex-col backdrop-blur-[40px] lg:top-20 lg:right-auto lg:bottom-auto lg:left-[calc(var(--frame-inset)+var(--reader-width)-2rem)] lg:max-h-[calc(100svh-6.5rem)] lg:w-[400px] lg:border"
    >
      <header className="border-hud/15 border-b px-6 pt-20 pb-5 lg:pt-5">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className={hudText}>Evidence</h2>
          <button type="button" onClick={onClose} className={actionStyle}>
            Close
          </button>
        </div>
        {total > 1 ? (
          <p className="text-fg-muted mt-3 flex gap-4 text-sm">
            <span>
              {pinned ? `Answer ${index} of ${total}` : 'Latest answer'}
            </span>
            {pinned ? (
              <button
                type="button"
                onClick={onShowLatest}
                className="hover:text-foreground underline underline-offset-4"
              >
                Show latest
              </button>
            ) : null}
          </p>
        ) : null}
        <p className="text-fg-secondary mt-3 line-clamp-2 text-sm">
          <span className="sr-only">For the question: </span>“{turn.question}”
        </p>
        <p className="text-fg-muted mt-1 text-sm">
          {count === 0
            ? active
              ? 'Sources appear here as the answer cites them.'
              : 'This answer cites no sources.'
            : `${count} ${count === 1 ? 'source' : 'sources'}${active ? ' so far' : ''}`}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-24 lg:pb-6">
        <ol aria-label="Sources" className="space-y-3">
          <LayoutGroup id={SOURCE_PREFIX}>
            {turn.sources.map((source, number) => (
              <SourceCard
                key={`${turn.attemptId}-${source.id}`}
                source={source}
                number={number + 1}
                idPrefix={SOURCE_PREFIX}
                active={picked === source.id}
                hovered={hovered === source.id}
                onHover={onHover}
                onSelect={onSelect}
              />
            ))}
          </LayoutGroup>
        </ol>
      </div>
    </motion.aside>
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
  evidenceShown,
  onCite,
  onHover,
  onStop,
  onRetry,
  onEdit,
  onToggleEvidence,
}: {
  turn: Turn
  isLast: boolean
  picked: string | null
  hovered: string | null
  /** The sidebar shows the sources of this answer. */
  evidenceShown: boolean
  onCite: (turnId: string, sourceId: string) => void
  onHover: (turnId: string, sourceId: string | null) => void
  onStop: () => void
  onRetry: (turnId: string) => void
  onEdit: (turn: Turn) => void
  onToggleEvidence: (turnId: string) => void
}) {
  const active = isActive(turn)
  const questionId = `${turn.id}-question`

  const citations = useMemo<CitationContextValue>(() => {
    const numbers = new Map(
      turn.sources.map((source, index) => [source.id, index + 1]),
    )
    const byId = new Map(turn.sources.map((source) => [source.id, source]))
    return {
      sourceNumber: (id) => numbers.get(id),
      getSource: (id) => byId.get(id),
      activeSourceId: evidenceShown ? picked : null,
      hoveredSourceId: evidenceShown ? hovered : null,
      animateIn: active,
      // While the sidebar shows this answer, it marks the source; else a
      // chip previews its source on hover.
      preview: !evidenceShown,
      onCite: (id) => onCite(turn.id, id),
      onHover: (id) => onHover(turn.id, id),
    }
  }, [
    turn.id,
    turn.sources,
    picked,
    hovered,
    evidenceShown,
    active,
    onCite,
    onHover,
  ])

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
        <p className={cn(hudText, 'mt-4')}>
          <Shimmer>Thinking</Shimmer>
        </p>
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
        {count > 0 ? (
          <button
            type="button"
            aria-pressed={evidenceShown}
            onClick={() => onToggleEvidence(turn.id)}
            className={actionStyle}
          >
            {count} {count === 1 ? 'source' : 'sources'}
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
    </motion.article>
  )
})
