import { useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import {
  ArrowUpRight,
  ChevronDown,
  CornerDownLeft,
  FileSearch,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react'
import type { Turn } from '~/lib/chat/chat-machine'
import type { ChatSource } from '~/lib/chat/protocol'
import { cn } from 'cn'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PathText from '~/components/PathText'
import { Button } from '~/components/ui/button'
import { revealSource } from '~/lib/chat/reveal-source'
import { SPRINGS } from '~/lib/design/motion'

export function evidenceSourceElementId(prefix: string, sourceId: string) {
  return `${prefix}-source-${sourceId}`
}

// remark-gfm turns a bare URL in a source into a link.
const sourceRemarkPlugins = [remarkGfm]

const sourceMarkdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-brand decoration-brand/40 hover:decoration-brand focus-visible:ring-brand/70 rounded-sm font-medium underline underline-offset-2 transition-colors outline-none focus-visible:ring-2"
    >
      {/* A bare URL reads better without its protocol. */}
      {typeof children === 'string' && children === href
        ? children.replace(/^https?:\/\//, '')
        : children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-4">{children}</ol>
  ),
  code: ({ children }) => (
    <code className="bg-foreground/10 rounded px-1 font-mono">{children}</code>
  ),
}

function hostname(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return href
  }
}

function SourceCard({
  active,
  hovered,
  idPrefix,
  number,
  onHover,
  onSelect,
  source,
}: {
  active: boolean
  hovered: boolean
  idPrefix: string
  number: number
  onHover: (sourceId: string | null) => void
  onSelect: (sourceId: string | null) => void
  source: ChatSource
}) {
  const reduceMotion = useReducedMotion()
  const [clamped, setClamped] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  // Only the selected card is open: a citation, Show more and a click on
  // the text all select it, and the card that was open before collapses.
  const open = active

  // Offer Show more and Show less only when the clamp hides text. An open
  // card can open before it was ever measured (a citation in an older
  // answer), so it compares its text with the four lines of the clamp.
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => {
      const limit = open
        ? 4 * parseFloat(getComputedStyle(body).lineHeight)
        : body.clientHeight
      setClamped(body.scrollHeight > limit + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [open])
  const elementId = evidenceSourceElementId(idPrefix, source.id)
  const bodyId = `${elementId}-body`
  const expandable = !open && clamped

  // When a card above it collapses, the selected card moves up, so bring
  // it into view after the change, as a citation does.
  function select() {
    onSelect(source.id)
    requestAnimationFrame(() => {
      if (cardRef.current) revealSource(cardRef.current)
    })
  }

  // A click on the text of a collapsed card selects and expands it, a
  // large target beside the small Show more button. Show more stays the keyboard and
  // screen reader path, so the text is not a button. Links keep their own
  // action, and a drag that selects text does not expand the card.
  function expandFromText(event: MouseEvent<HTMLDivElement>) {
    if (!expandable) return
    if ((event.target as Element).closest('a, button')) return
    if (!window.getSelection()?.isCollapsed) return
    select()
  }

  return (
    <motion.li
      layout={reduceMotion ? false : 'position'}
      initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRINGS.settle}
      className="relative"
    >
      {active && (
        <motion.span
          layoutId={`${idPrefix}-active-source`}
          aria-hidden="true"
          transition={SPRINGS.settle}
          className="border-brand bg-brand/[0.06] pointer-events-none absolute inset-0 rounded-xl border"
        />
      )}
      <article
        ref={cardRef}
        id={elementId}
        tabIndex={-1}
        aria-labelledby={`${elementId}-title`}
        onPointerEnter={() => onHover(source.id)}
        onPointerLeave={() => onHover(null)}
        className={cn(
          'focus-visible:ring-brand/70 relative scroll-mt-4 scroll-mb-4 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2',
          active
            ? 'border-transparent'
            : hovered
              ? 'border-brand/50'
              : 'border-foreground/10',
        )}
      >
        <header className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full border text-sm tabular-nums transition-colors',
              active || hovered
                ? 'border-brand bg-brand text-brand-foreground'
                : 'border-foreground/20 text-fg-secondary',
            )}
          >
            {number}
          </span>
          <div className="min-w-0">
            {source.group && (
              <p
                className={cn(
                  'text-fg-muted text-sm [overflow-wrap:anywhere]',
                  // A code path reads as code; a category reads as text.
                  source.group.includes('/') && 'font-mono',
                )}
              >
                <PathText path={source.group} />
              </p>
            )}
            <h3
              id={`${elementId}-title`}
              className="text-foreground text-sm leading-5 font-semibold"
            >
              <span className="sr-only">Source {number}: </span>
              {source.title}
            </h3>
          </div>
        </header>

        <div
          ref={bodyRef}
          id={bodyId}
          onClick={expandFromText}
          className={cn(
            'text-fg-secondary mt-3 space-y-2 text-sm leading-6 transition-colors [overflow-wrap:anywhere]',
            !open && 'line-clamp-4',
            expandable && 'hover:text-foreground cursor-pointer',
          )}
        >
          <ReactMarkdown
            remarkPlugins={sourceRemarkPlugins}
            components={sourceMarkdownComponents}
          >
            {source.body}
          </ReactMarkdown>
        </div>

        <footer className="mt-3 flex items-center justify-between gap-3">
          {source.href ? (
            <a
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="text-fg-muted hover:text-brand inline-flex min-w-0 items-center gap-1 text-sm transition-colors"
            >
              <span className="truncate">{hostname(source.href)}</span>
              <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <span />
          )}
          {clamped && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => (open ? onSelect(null) : select())}
              className="group/more text-fg-secondary hover:bg-brand/10 hover:text-brand focus-visible:ring-brand/70 -mr-2 inline-flex h-7 shrink-0 items-center gap-1 rounded-full pr-2 pl-2.5 text-sm font-medium transition-[color,background-color,scale] duration-200 outline-none focus-visible:ring-2 active:scale-97 motion-reduce:active:scale-100"
            >
              {open ? 'Show less' : 'Show more'}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                  open
                    ? 'rotate-180 group-hover/more:-translate-y-px'
                    : 'group-hover/more:translate-y-px',
                )}
              />
            </button>
          )}
        </footer>
      </article>
    </motion.li>
  )
}

function PanelStatus({ turn }: { turn: Turn }) {
  const count = turn.sources.length
  if (turn.status === 'pending') return <>Searching Ali&apos;s record…</>
  if (turn.status === 'streaming') {
    return count === 0 ? (
      <>Sources appear here as the answer cites them.</>
    ) : (
      <>
        {count} {count === 1 ? 'source' : 'sources'} cited so far…
      </>
    )
  }
  if (count === 0) {
    return turn.status === 'complete' ? (
      <>This answer cites no sources. Treat it as unverified.</>
    ) : (
      <>The answer did not finish, and it cites no sources.</>
    )
  }
  return (
    <>
      {count} {count === 1 ? 'source' : 'sources'} cited
      {turn.status === 'stopped' && ' before you stopped the answer'}
      {turn.status === 'failed' && ' before the answer failed'}.
    </>
  )
}

export type EvidenceScope = {
  /** 1-based position of the answer the panel shows. */
  index: number
  total: number
  /** The panel stays on this answer. Otherwise it follows the latest. */
  pinned: boolean
}

export default function EvidencePanel({
  activeSourceId,
  headingId,
  hoveredSourceId,
  idPrefix,
  onCollapse,
  onHover,
  onSelect,
  onShowLatest,
  scope,
  turn,
}: {
  activeSourceId: string | null
  headingId: string
  hoveredSourceId: string | null
  idPrefix: string
  onCollapse?: () => void
  onHover: (sourceId: string | null) => void
  /** Select a source, which opens its card, or clear the selection. */
  onSelect: (sourceId: string | null) => void
  onShowLatest: () => void
  scope: EvidenceScope | undefined
  turn: Turn | undefined
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Sticky, so the heading and the hide button stay at hand while the
          sources scroll. The scroll container sets the padding above it and
          the surface color. Where the browser has scroll-driven animations,
          a hairline under it appears once the sources scroll under it. The
          timeline comes after the animation shorthand, which resets it, so
          it is important. */}
      <header
        data-evidence-header
        className="supports-[animation-timeline:scroll()]:animate-header-line sticky top-0 z-10 -mx-5 space-y-2 bg-(--evidence-surface,var(--color-background)) px-5 pt-(--evidence-pad,1.5rem) pb-3 supports-[animation-timeline:scroll()]:[animation-range:0_16px]! supports-[animation-timeline:scroll()]:[animation-timeline:scroll(nearest)]!"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id={headingId}
            tabIndex={-1}
            className="text-foreground flex items-center gap-2 text-base font-semibold outline-none"
          >
            <FileSearch className="text-brand size-4" aria-hidden="true" />
            Evidence
          </h2>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              aria-label="Hide evidence"
              aria-expanded="true"
              className="-mr-1.5"
            >
              <PanelRightClose className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        {turn ? (
          <>
            {scope && scope.total > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-fg-muted">
                  {scope.pinned
                    ? `Answer ${scope.index} of ${scope.total}`
                    : 'Latest answer'}
                </span>
                {scope.pinned && (
                  <button
                    type="button"
                    onClick={onShowLatest}
                    className="text-fg-muted hover:text-foreground focus-visible:ring-brand/70 inline-flex items-center gap-1 rounded font-medium outline-none focus-visible:ring-2"
                  >
                    <CornerDownLeft className="size-3" aria-hidden="true" />
                    Show latest
                  </button>
                )}
              </div>
            )}
            <p className="text-fg-muted line-clamp-2 text-sm">
              <span className="sr-only">For the question: </span>“
              {turn.question}”
            </p>
            <p className="text-fg-muted text-sm">
              <PanelStatus turn={turn} />
            </p>
          </>
        ) : (
          <p className="text-fg-muted text-sm">
            Ask a question. Each claim in the answer links to the source that
            supports it.
          </p>
        )}
      </header>

      {turn && turn.sources.length > 0 && (
        <ol className="space-y-3" aria-label="Sources">
          {/* One group, so when one card opens or closes, the cards below
              it slide on the same spring as when a citation opens a card. */}
          <LayoutGroup>
            <AnimatePresence initial={false}>
              {turn.sources.map((source, index) => (
                <SourceCard
                  key={`${turn.attemptId}-${source.id}`}
                  source={source}
                  number={index + 1}
                  idPrefix={idPrefix}
                  active={activeSourceId === source.id}
                  hovered={hoveredSourceId === source.id}
                  onHover={onHover}
                  onSelect={onSelect}
                />
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </ol>
      )}
    </div>
  )
}

/**
 * The collapsed panel. It keeps the evidence present: the source count
 * updates while an answer streams, and the whole rail opens the panel.
 */
export function EvidenceRail({
  controlsId,
  onExpand,
  sourceCount,
  streaming,
}: {
  controlsId: string
  onExpand: () => void
  sourceCount: number
  streaming: boolean
}) {
  const reduceMotion = useReducedMotion()

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-expanded="false"
      aria-controls={controlsId}
      aria-label={`Show evidence, ${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`}
      className="group/rail text-fg-muted hover:text-foreground hover:bg-foreground/[0.03] focus-visible:ring-brand/70 flex h-full w-full flex-col items-center gap-4 py-6 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
    >
      <PanelRightOpen className="size-4" aria-hidden="true" />
      <span className="relative flex size-7 items-center justify-center">
        {streaming && (
          <span
            aria-hidden="true"
            className="bg-brand/25 absolute inset-0 animate-ping rounded-full motion-reduce:animate-none"
          />
        )}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={sourceCount}
            initial={reduceMotion ? false : { scale: 0.5, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { scale: 0.5, opacity: 0, y: -6 }}
            transition={SPRINGS.pop}
            className={cn(
              'relative flex size-7 items-center justify-center rounded-full border text-sm tabular-nums',
              sourceCount > 0
                ? 'border-brand bg-brand text-brand-foreground'
                : 'border-foreground/20',
            )}
          >
            {sourceCount}
          </motion.span>
        </AnimatePresence>
      </span>
      <span
        aria-hidden="true"
        className="text-sm font-medium [writing-mode:vertical-rl]"
      >
        Evidence
      </span>
    </button>
  )
}
