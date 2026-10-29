import { useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  CornerDownLeft,
  FileSearch,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Turn } from '~/lib/chat/chat-machine'
import type { ChatSource } from '~/lib/chat/protocol'
import { cn } from 'cn'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import PathText from '~/components/PathText'

export function evidenceSourceElementId(prefix: string, sourceId: string) {
  return `${prefix}-source-${sourceId}`
}

const sourceMarkdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-current/35 underline-offset-2 hover:decoration-current"
    >
      {children}
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
  source,
}: {
  active: boolean
  hovered: boolean
  idPrefix: string
  number: number
  onHover: (sourceId: string | null) => void
  source: ChatSource
}) {
  const reduceMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const open = expanded || active

  // Offer "Show more" only when the clamp hides text.
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || open) return
    const measure = () => setClamped(body.scrollHeight > body.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [open])
  const elementId = evidenceSourceElementId(idPrefix, source.id)
  const bodyId = `${elementId}-body`

  return (
    <motion.li
      layout={reduceMotion ? false : 'position'}
      initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="relative"
    >
      {active && (
        <motion.span
          layoutId={`${idPrefix}-active-source`}
          aria-hidden="true"
          transition={{ type: 'spring', stiffness: 480, damping: 38 }}
          className="border-brand bg-brand/[0.06] pointer-events-none absolute inset-0 rounded-xl border"
        />
      )}
      <article
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
                : 'border-foreground/20 text-foreground/70',
            )}
          >
            {number}
          </span>
          <div className="min-w-0">
            {source.group && (
              <p className="text-foreground/55 font-mono text-sm [overflow-wrap:anywhere]">
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
          className={cn(
            'text-foreground/65 mt-3 space-y-2 text-sm leading-6 [overflow-wrap:anywhere]',
            !open && 'line-clamp-4',
          )}
        >
          <ReactMarkdown components={sourceMarkdownComponents}>
            {source.body}
          </ReactMarkdown>
        </div>

        <footer className="mt-3 flex items-center justify-between gap-3">
          {source.href ? (
            <a
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="text-foreground/60 hover:text-brand inline-flex min-w-0 items-center gap-1 text-sm transition-colors"
            >
              <span className="truncate">{hostname(source.href)}</span>
              <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <span />
          )}
          {!active && (clamped || expanded) && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={bodyId}
              onClick={() => setExpanded((value) => !value)}
              className="text-foreground/60 hover:text-foreground focus-visible:ring-brand/70 shrink-0 rounded text-sm font-medium outline-none focus-visible:ring-2"
            >
              {expanded ? 'Show less' : 'Show more'}
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
  onShowLatest: () => void
  scope: EvidenceScope | undefined
  turn: Turn | undefined
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Sticky, so the heading and the hide button stay at hand while the
          sources scroll. The scroll container sets the padding above it and
          the surface color (see .evidence-header in globals.css). */}
      <header
        data-evidence-header
        className="evidence-header sticky top-0 z-10 -mx-5 space-y-2 bg-(--evidence-surface,var(--color-background)) px-5 pt-(--evidence-pad,1.5rem) pb-3"
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
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Hide evidence"
              aria-expanded="true"
              className="text-foreground/50 hover:text-foreground hover:bg-foreground/[0.06] focus-visible:ring-brand/70 -mr-1.5 flex size-8 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2"
            >
              <PanelRightClose className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {turn ? (
          <>
            {scope && scope.total > 1 && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-foreground/55">
                  {scope.pinned
                    ? `Answer ${scope.index} of ${scope.total}`
                    : 'Latest answer'}
                </span>
                {scope.pinned && (
                  <button
                    type="button"
                    onClick={onShowLatest}
                    className="text-foreground/60 hover:text-foreground focus-visible:ring-brand/70 inline-flex items-center gap-1 rounded font-medium outline-none focus-visible:ring-2"
                  >
                    <CornerDownLeft className="size-3" aria-hidden="true" />
                    Show latest
                  </button>
                )}
              </div>
            )}
            <p className="text-foreground/50 line-clamp-2 text-sm">
              <span className="sr-only">For the question: </span>“
              {turn.question}”
            </p>
            <p className="text-foreground/55 text-sm">
              <PanelStatus turn={turn} />
            </p>
          </>
        ) : (
          <p className="text-foreground/50 text-sm">
            Ask a question. Each claim in the answer links to the source that
            supports it.
          </p>
        )}
      </header>

      {turn && turn.sources.length > 0 && (
        <ol className="space-y-3" aria-label="Sources">
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
              />
            ))}
          </AnimatePresence>
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
      className="group/rail text-foreground/55 hover:text-foreground hover:bg-foreground/[0.03] focus-visible:ring-brand/70 flex h-full w-full flex-col items-center gap-4 py-6 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
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
            transition={{ type: 'spring', stiffness: 560, damping: 28 }}
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
