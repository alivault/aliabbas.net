import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import MonoLabel from '~/components/MonoLabel'
import PageHeading from '~/components/PageHeading'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '~/components/ui/message-scroller'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '~/components/ui/sheet'
import type { Turn } from '~/lib/chat/chat-machine'
import { answerToPlainText } from '~/lib/chat/streaming-markdown'
import ChatComposer from './ChatComposer'
import ChatTurn from './ChatTurn'
import EvidencePanel, { evidenceSourceElementId } from './EvidencePanel'
import { useChatSession } from './use-chat-session'

const suggestedQuestions = [
  'What makes Ali a strong frontend engineer?',
  'Has Ali built streaming interfaces?',
  'Which project best shows full-stack skills?',
  'How does his design background shape his engineering?',
] as const

const AnimatedMessageScrollerItem = motion.create(MessageScrollerItem)

const DESKTOP_QUERY = '(min-width: 1024px)'
const ASIDE_PREFIX = 'evidence-aside'
const SHEET_PREFIX = 'evidence-sheet'

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  )
}

function SuggestedQuestionButtons({
  className,
  onSelect,
  questions,
}: {
  className?: string
  onSelect: (question: string) => void
  questions: ReadonlyArray<string>
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={className}>
      {questions.map((question, index) => (
        <motion.button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 8, scale: 0.9, filter: 'blur(8px)' }
          }
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.22, delay: index * 0.08 },
                  filter: { duration: 0.3, delay: index * 0.08 },
                  y: {
                    type: 'spring',
                    stiffness: 460,
                    damping: 28,
                    delay: index * 0.08,
                  },
                  scale: {
                    type: 'spring',
                    stiffness: 460,
                    damping: 22,
                    delay: index * 0.08,
                  },
                }
          }
          className="border-foreground/15 text-foreground/60 hover:border-brand/60 hover:text-brand focus-visible:ring-brand/70 max-w-full rounded-[21px] border px-4 py-2 text-left text-base transition-colors outline-none focus-visible:ring-2"
        >
          {question}
        </motion.button>
      ))}
    </div>
  )
}

/** What the screen reader hears when the last turn changes state. */
function announcementFor(turn: Turn | undefined) {
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

export default function PortfolioChat() {
  const { turns, activeTurn, send, stop, retry, remove } = useChatSession()
  const isDesktop = useIsDesktop()
  const reduceMotion = useReducedMotion()
  const [draft, setDraft] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // Evidence: which turn the panel shows (null follows the latest turn), the
  // selected source, and the source under the pointer or keyboard focus.
  const [evidenceTurnId, setEvidenceTurnId] = useState<string | null>(null)
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [hovered, setHovered] = useState<{
    turnId: string
    sourceId: string
  } | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{
    target: 'source' | 'heading'
    sourceId: string | null
    nonce: number
  } | null>(null)
  const citeTriggerRef = useRef<HTMLElement | null>(null)

  const lastTurn = turns.at(-1)
  const evidenceTurn =
    turns.find((turn) => turn.id === evidenceTurnId) ?? lastTurn
  const hoveredSourceId =
    hovered && hovered.turnId === evidenceTurn?.id ? hovered.sourceId : null
  const isStreaming = activeTurn !== undefined
  const hasConversation = turns.length > 0

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = composerRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    })
  }, [])

  const submit = useCallback(
    (question: string) => {
      if (!send(question)) return
      setDraft('')
      setEvidenceTurnId(null)
      setActiveSourceId(null)
      setSheetOpen(false)
    },
    [send],
  )

  const handleCite = useCallback(
    (turnId: string, sourceId: string) => {
      citeTriggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      setEvidenceTurnId(turnId)
      setActiveSourceId(sourceId)
      if (isDesktop) {
        setFocusRequest((request) => ({
          target: 'source',
          sourceId,
          nonce: (request?.nonce ?? 0) + 1,
        }))
      } else {
        setSheetOpen(true)
      }
    },
    [isDesktop],
  )

  const handleShowEvidence = useCallback(
    (turnId: string) => {
      citeTriggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      setEvidenceTurnId(turnId)
      setActiveSourceId(null)
      if (isDesktop) {
        setFocusRequest((request) => ({
          target: 'heading',
          sourceId: null,
          nonce: (request?.nonce ?? 0) + 1,
        }))
      } else {
        setSheetOpen(true)
      }
    },
    [isDesktop],
  )

  const handleHover = useCallback((turnId: string, sourceId: string | null) => {
    setHovered(sourceId ? { turnId, sourceId } : null)
  }, [])

  const handlePanelHover = useCallback(
    (sourceId: string | null) => {
      if (!evidenceTurn) return
      setHovered(sourceId ? { turnId: evidenceTurn.id, sourceId } : null)
    },
    [evidenceTurn],
  )

  const handleRetry = useCallback(
    (turnId: string) => {
      retry(turnId)
      setActiveSourceId(null)
      focusComposer()
    },
    [retry, focusComposer],
  )

  const handleEdit = useCallback(
    (turn: Turn) => {
      remove(turn.id)
      setDraft(turn.question)
      setActiveSourceId(null)
      focusComposer()
    },
    [remove, focusComposer],
  )

  // Move focus into the desktop panel after it shows the requested source.
  useEffect(() => {
    if (!focusRequest) return
    const frame = requestAnimationFrame(() => {
      const element =
        focusRequest.target === 'source' && focusRequest.sourceId
          ? document.getElementById(
              evidenceSourceElementId(ASIDE_PREFIX, focusRequest.sourceId),
            )
          : document.getElementById(`${ASIDE_PREFIX}-heading`)
      if (!element) return
      element.focus({ preventScroll: true })
      element.scrollIntoView({
        block: 'nearest',
        behavior: reduceMotion ? 'auto' : 'smooth',
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [focusRequest, reduceMotion])

  // Esc stops the answer, anywhere on the page.
  useEffect(() => {
    if (!isStreaming || sheetOpen) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      stop()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isStreaming, sheetOpen, stop])

  // Esc in the panel goes back to the citation that opened it.
  const handleAsideKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return
    const trigger = citeTriggerRef.current
    if (!trigger?.isConnected) return
    event.preventDefault()
    trigger.focus()
  }

  const askedQuestions = new Set(
    turns.map((turn) => turn.question.trim().toLowerCase()),
  )
  const unusedQuestions = suggestedQuestions.filter(
    (question) => !askedQuestions.has(question.toLowerCase()),
  )

  const composerProps = {
    value: draft,
    isStreaming,
    onChange: setDraft,
    onStop: stop,
    onSubmit: () => submit(draft),
  }

  return (
    <div className="flex h-[calc(100svh-72px)] min-h-0 min-w-0 overflow-hidden">
      <p role="status" aria-live="polite" className="sr-only">
        {announcementFor(lastTurn)}
      </p>

      {!hasConversation && (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-end justify-start overflow-y-auto px-4 py-8 sm:px-6 sm:py-10 lg:items-center lg:justify-center lg:py-12">
            <div className="flex w-full max-w-3xl flex-col items-start lg:items-center">
              <PageHeading className="text-left lg:text-center">
                Ask about <em className="text-brand">Ali.</em>
              </PageHeading>
              <p className="text-foreground/55 mt-5 max-w-xl text-left text-base leading-7 lg:text-center">
                An AI guide to Ali&apos;s public record. Every claim links to
                its source, so you can check the evidence beside the answer.
              </p>
              <ChatComposer
                id="portfolio-question-initial"
                className="mt-10 hidden w-full lg:block"
                showHints
                {...composerProps}
              />
              <div className="mt-8 w-full">
                <MonoLabel className="text-left lg:text-center">
                  Try asking
                </MonoLabel>
                <SuggestedQuestionButtons
                  questions={suggestedQuestions}
                  onSelect={submit}
                  className="mt-4 flex flex-wrap justify-start gap-2 lg:justify-center"
                />
              </div>
            </div>
          </div>
          <ChatComposer
            id="portfolio-question-initial-mobile"
            className="shrink-0 p-3 sm:p-4 lg:hidden"
            {...composerProps}
          />
        </section>
      )}

      {hasConversation && (
        <>
          <section
            aria-label="Conversation"
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            <MessageScrollerProvider scrollPreviousItemPeek={48}>
              <MessageScroller className="flex-1">
                <MessageScrollerViewport className="px-4 py-6 sm:px-6 sm:py-8">
                  <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-10">
                    {turns.map((turn, index) => {
                      const showsEvidence = turn.id === evidenceTurn?.id
                      return (
                        <AnimatedMessageScrollerItem
                          key={turn.id}
                          messageId={turn.id}
                          scrollAnchor
                          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.28,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <ChatTurn
                            turn={turn}
                            isLast={index === turns.length - 1}
                            showsEvidence={showsEvidence}
                            activeSourceId={
                              showsEvidence ? activeSourceId : null
                            }
                            hoveredSourceId={
                              showsEvidence ? hoveredSourceId : null
                            }
                            onCite={handleCite}
                            onHover={handleHover}
                            onShowEvidence={handleShowEvidence}
                            onRetry={handleRetry}
                            onEdit={handleEdit}
                          />
                        </AnimatedMessageScrollerItem>
                      )
                    })}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton
                  size="icon-lg"
                  className="border-foreground/15 bg-background/80 text-foreground hover:bg-brand hover:text-brand-foreground rounded-full backdrop-blur-[12px] backdrop-saturate-[1.8]"
                />
              </MessageScroller>
            </MessageScrollerProvider>

            <div className="shrink-0 px-3 pb-5 sm:px-4 sm:pb-6">
              <div className="mx-auto w-full max-w-3xl">
                {!isStreaming && unusedQuestions.length > 0 && (
                  <SuggestedQuestionButtons
                    questions={unusedQuestions}
                    onSelect={submit}
                    className="-mx-3 mb-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>button]:shrink-0 [&>button]:whitespace-nowrap sm:[&>button]:shrink sm:[&>button]:whitespace-normal"
                  />
                )}
                <ChatComposer
                  id="portfolio-question"
                  textareaRef={composerRef}
                  showHints
                  {...composerProps}
                />
              </div>
            </div>
          </section>

          <aside
            aria-labelledby={`${ASIDE_PREFIX}-heading`}
            onKeyDown={handleAsideKeyDown}
            className="border-foreground/10 hidden w-[min(400px,34vw)] shrink-0 overflow-y-auto overscroll-contain border-l px-5 py-6 lg:block"
          >
            <EvidencePanel
              idPrefix={ASIDE_PREFIX}
              headingId={`${ASIDE_PREFIX}-heading`}
              turn={evidenceTurn}
              activeSourceId={activeSourceId}
              hoveredSourceId={hoveredSourceId}
              onHover={handlePanelHover}
            />
          </aside>
        </>
      )}

      {!isDesktop && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85svh] rounded-t-2xl"
            initialFocus={() =>
              (activeSourceId &&
                document.getElementById(
                  evidenceSourceElementId(SHEET_PREFIX, activeSourceId),
                )) ||
              true
            }
          >
            <SheetTitle className="sr-only">Evidence</SheetTitle>
            <SheetDescription className="sr-only">
              The sources that the answer cites.
            </SheetDescription>
            <div className="overflow-y-auto overscroll-contain px-5 pt-6 pb-8">
              <EvidencePanel
                idPrefix={SHEET_PREFIX}
                headingId={`${SHEET_PREFIX}-heading`}
                turn={evidenceTurn}
                activeSourceId={activeSourceId}
                hoveredSourceId={hoveredSourceId}
                onHover={handlePanelHover}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
