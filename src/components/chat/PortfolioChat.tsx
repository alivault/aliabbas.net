import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import MonoLabel from '~/components/MonoLabel'
import { usePanelActive } from '~/components/assistant/panel-active'
import { revealSource } from '~/lib/chat/reveal-source'
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '~/components/ui/drawer'
import type { Turn } from '~/lib/chat/chat-machine'
import { answerToPlainText } from '~/lib/chat/streaming-markdown'
import ChatComposer from './ChatComposer'
import ChatTurn from './ChatTurn'
import EvidenceLayout, { PANEL_SPRING_MS } from './EvidenceLayout'
import EvidencePanel, {
  EvidenceRail,
  evidenceSourceElementId,
} from './EvidencePanel'
import { useChatSession } from './use-chat-session'
import { usePanelRef } from 'react-resizable-panels'

const suggestedQuestions = [
  'What makes Ali a strong frontend engineer?',
  'Has Ali built streaming interfaces?',
  'Which project best shows full-stack skills?',
  'How does his design background shape his engineering?',
] as const

const AnimatedMessageScrollerItem = motion.create(MessageScrollerItem)

const DESKTOP_QUERY = '(min-width: 1024px)'
const ASIDE_PREFIX = 'evidence-aside'
const DRAWER_PREFIX = 'evidence-drawer'
const EVIDENCE_ID = 'evidence-panel'

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
  // The entrance is CSS (.enter-pop), so the questions paint before
  // hydration. They are the largest text in the first screen.
  return (
    <div className={className}>
      {questions.map((question, index) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          style={{ '--enter-delay': `${index * 80}ms` } as CSSProperties}
          className="enter-pop border-foreground/15 text-foreground/60 hover:border-brand/60 hover:text-brand focus-visible:ring-brand/70 max-w-full rounded-[21px] border px-4 py-2 text-left text-base transition-colors outline-none focus-visible:ring-2"
        >
          {question}
        </button>
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

type FocusTarget =
  | { kind: 'source'; sourceId: string }
  | { kind: 'heading' }
  | { kind: 'rail' }

/** Focus an element that can mount a few frames late, after a transition. */
function focusWhenReady(find: () => HTMLElement | null, scroll: boolean) {
  let frame = 0
  let tries = 0
  const attempt = () => {
    const element = find()
    if (element) {
      element.focus({ preventScroll: true })
      // Wait one frame more: the card that was active collapses and this
      // one opens in the same commit.
      if (scroll) requestAnimationFrame(() => revealSource(element))
      return
    }
    tries += 1
    if (tries < 30) frame = requestAnimationFrame(attempt)
  }
  frame = requestAnimationFrame(attempt)
  return () => cancelAnimationFrame(frame)
}

export default function PortfolioChat() {
  const panelActive = usePanelActive()
  const { turns, activeTurn, send, stop, retry, remove } = useChatSession()
  const isDesktop = useIsDesktop()
  const reduceMotion = useReducedMotion()
  const [draft, setDraft] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // Evidence state. The panel shows one answer: the latest one, or an
  // answer the visitor pinned. On desktop it is open or collapsed to a
  // rail; on mobile it is a drawer.
  const [evidenceTurnId, setEvidenceTurnId] = useState<string | null>(null)
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [hovered, setHovered] = useState<{
    turnId: string
    sourceId: string
  } | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{
    target: FocusTarget
    nonce: number
  } | null>(null)
  const citeTriggerRef = useRef<HTMLElement | null>(null)
  const panelRef = usePanelRef()
  const groupElementRef = useRef<HTMLDivElement | null>(null)
  const animationTimerRef = useRef(0)
  const openWidthRef = useRef<number | null>(null)

  const lastTurn = turns.at(-1)
  const evidenceTurn =
    turns.find((turn) => turn.id === evidenceTurnId) ?? lastTurn
  const evidenceIndex = evidenceTurn ? turns.indexOf(evidenceTurn) : -1
  const hoveredSourceId =
    hovered && hovered.turnId === evidenceTurn?.id ? hovered.sourceId : null
  const evidenceVisible = isDesktop ? !collapsed : drawerOpen
  const isStreaming = activeTurn !== undefined
  const hasConversation = turns.length > 0

  const requestFocus = useCallback((target: FocusTarget) => {
    setFocusRequest((request) => ({
      target,
      nonce: (request?.nonce ?? 0) + 1,
    }))
  }, [])

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = composerRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    })
  }, [])

  /** Open or collapse the desktop panel with the spring transition. */
  const setPanelOpen = useCallback(
    (open: boolean) => {
      const panel = panelRef.current
      if (!panel || panel.isCollapsed() !== open) return
      const group = groupElementRef.current
      if (group && !reduceMotion) {
        group.setAttribute('data-animating', '')
        window.clearTimeout(animationTimerRef.current)
        animationTimerRef.current = window.setTimeout(() => {
          group.removeAttribute('data-animating')
          setCollapsed(panelRef.current?.isCollapsed() ?? !open)
        }, PANEL_SPRING_MS + 50)
      }
      setCollapsed(!open)
      // Open at the last width. After a drag to collapse, expand() alone
      // would open at the minimum width.
      const width = openWidthRef.current
      if (open && width) panel.resize(`${Math.round(width)}px`)
      else if (open) panel.expand()
      else panel.collapse()
    },
    [panelRef, reduceMotion],
  )

  const rememberTrigger = () => {
    citeTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  }

  /** Show an answer in the panel. Pin it unless it is the latest. */
  const scopeTo = useCallback(
    (turnId: string) => {
      setEvidenceTurnId(turnId === lastTurn?.id ? null : turnId)
    },
    [lastTurn?.id],
  )

  const submit = useCallback(
    (question: string) => {
      if (!send(question)) return
      setDraft('')
      setEvidenceTurnId(null)
      setActiveSourceId(null)
      setDrawerOpen(false)
    },
    [send],
  )

  const handleCite = useCallback(
    (turnId: string, sourceId: string) => {
      rememberTrigger()
      scopeTo(turnId)
      setActiveSourceId(sourceId)
      if (isDesktop) {
        setPanelOpen(true)
        requestFocus({ kind: 'source', sourceId })
      } else {
        setDrawerOpen(true)
      }
    },
    [isDesktop, scopeTo, setPanelOpen, requestFocus],
  )

  const handleToggleEvidence = useCallback(
    (turnId: string) => {
      const showing = evidenceVisible && evidenceTurn?.id === turnId
      if (showing) {
        if (isDesktop) setPanelOpen(false)
        else setDrawerOpen(false)
        return
      }
      rememberTrigger()
      scopeTo(turnId)
      setActiveSourceId(null)
      if (isDesktop) {
        setPanelOpen(true)
        requestFocus({ kind: 'heading' })
      } else {
        setDrawerOpen(true)
      }
    },
    [
      evidenceVisible,
      evidenceTurn?.id,
      isDesktop,
      scopeTo,
      setPanelOpen,
      requestFocus,
    ],
  )

  const handleCollapse = useCallback(() => {
    setPanelOpen(false)
    requestFocus({ kind: 'rail' })
  }, [setPanelOpen, requestFocus])

  const handleExpand = useCallback(() => {
    setPanelOpen(true)
    requestFocus({ kind: 'heading' })
  }, [setPanelOpen, requestFocus])

  const handleToggleFromHandle = useCallback(() => {
    setPanelOpen(collapsed)
  }, [collapsed, setPanelOpen])

  const handleShowLatest = useCallback(() => {
    setEvidenceTurnId(null)
    setActiveSourceId(null)
  }, [])

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

  // Move focus in the desktop panel after it renders the requested state.
  useEffect(() => {
    if (!focusRequest) return
    const { target } = focusRequest
    return focusWhenReady(() => {
      if (target.kind === 'source') {
        return document.getElementById(
          evidenceSourceElementId(ASIDE_PREFIX, target.sourceId),
        )
      }
      if (target.kind === 'heading') {
        return document.getElementById(`${ASIDE_PREFIX}-heading`)
      }
      return document.querySelector<HTMLElement>(
        `#${EVIDENCE_ID} button[aria-expanded="false"]`,
      )
    }, target.kind === 'source')
  }, [focusRequest])

  useEffect(() => () => window.clearTimeout(animationTimerRef.current), [])

  // Esc stops the answer, anywhere on the page.
  useEffect(() => {
    if (!isStreaming || drawerOpen || !panelActive) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      stop()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isStreaming, drawerOpen, stop, panelActive])

  // Esc in the panel goes back to the control that opened it.
  const handleEvidenceKeyDown = (event: KeyboardEvent<HTMLElement>) => {
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

  const scope =
    evidenceTurn && evidenceIndex >= 0
      ? {
          index: evidenceIndex + 1,
          total: turns.length,
          pinned: evidenceTurnId !== null && evidenceTurn !== lastTurn,
        }
      : undefined

  const conversation = (
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
                      evidenceVisible={showsEvidence && evidenceVisible}
                      activeSourceId={showsEvidence ? activeSourceId : null}
                      hoveredSourceId={showsEvidence ? hoveredSourceId : null}
                      onCite={handleCite}
                      onHover={handleHover}
                      onToggleEvidence={handleToggleEvidence}
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
  )

  return (
    <div className="flex h-[calc(100svh-72px-var(--assistant-bar,0px))] min-h-0 min-w-0 overflow-hidden">
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
        <EvidenceLayout
          showEvidence={isDesktop}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onEvidenceKeyDown={handleEvidenceKeyDown}
          onToggle={handleToggleFromHandle}
          openWidthRef={openWidthRef}
          panelRef={panelRef}
          groupElementRef={groupElementRef}
          evidenceId={EVIDENCE_ID}
          conversation={conversation}
          evidence={
            <EvidencePanel
              idPrefix={ASIDE_PREFIX}
              headingId={`${ASIDE_PREFIX}-heading`}
              turn={evidenceTurn}
              scope={scope}
              activeSourceId={activeSourceId}
              hoveredSourceId={hoveredSourceId}
              onHover={handlePanelHover}
              onShowLatest={handleShowLatest}
              onCollapse={handleCollapse}
            />
          }
          rail={
            <EvidenceRail
              controlsId={EVIDENCE_ID}
              onExpand={handleExpand}
              sourceCount={evidenceTurn?.sources.length ?? 0}
              streaming={evidenceTurn?.status === 'streaming'}
            />
          }
        />
      )}

      {!isDesktop && (
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          snapPoints={[0.6, 1]}
          showSwipeHandle
        >
          <DrawerContent
            initialFocus={() =>
              (activeSourceId &&
                document.getElementById(
                  evidenceSourceElementId(DRAWER_PREFIX, activeSourceId),
                )) ||
              true
            }
          >
            <DrawerTitle className="sr-only">Evidence</DrawerTitle>
            <DrawerDescription className="sr-only">
              The sources that the answer cites. Drag up to see more.
            </DrawerDescription>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-8">
              <EvidencePanel
                idPrefix={DRAWER_PREFIX}
                headingId={`${DRAWER_PREFIX}-heading`}
                turn={evidenceTurn}
                scope={scope}
                activeSourceId={activeSourceId}
                hoveredSourceId={hoveredSourceId}
                onHover={handlePanelHover}
                onShowLatest={handleShowLatest}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
