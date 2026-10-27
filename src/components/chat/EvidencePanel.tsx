import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, FileSearch } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import MonoLabel from '~/components/MonoLabel'
import type { Turn } from '~/lib/chat/chat-machine'
import type { ChatSource } from '~/lib/chat/protocol'
import { cn } from '~/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

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
    <code className="bg-foreground/10 rounded px-1 font-mono text-[0.9em]">
      {children}
    </code>
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
              'flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[0.7rem] tabular-nums transition-colors',
              active || hovered
                ? 'border-brand bg-brand text-brand-foreground'
                : 'border-foreground/20 text-foreground/70',
            )}
          >
            {number}
          </span>
          <div className="min-w-0">
            {source.group && <MonoLabel>{source.group}</MonoLabel>}
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
            'text-foreground/65 mt-3 space-y-2 text-[0.8rem] leading-5 [overflow-wrap:anywhere]',
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
              className="text-foreground/60 hover:text-brand inline-flex min-w-0 items-center gap-1 font-mono text-[11px] uppercase transition-colors"
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
              className="text-foreground/50 hover:text-foreground focus-visible:ring-brand/70 shrink-0 rounded font-mono text-[11px] uppercase outline-none focus-visible:ring-2"
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

export default function EvidencePanel({
  activeSourceId,
  headingId,
  hoveredSourceId,
  idPrefix,
  onHover,
  turn,
}: {
  activeSourceId: string | null
  headingId: string
  hoveredSourceId: string | null
  idPrefix: string
  onHover: (sourceId: string | null) => void
  turn: Turn | undefined
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="space-y-2">
        <h2
          id={headingId}
          tabIndex={-1}
          className="text-foreground flex items-center gap-2 text-base font-semibold outline-none"
        >
          <FileSearch className="text-brand size-4" aria-hidden="true" />
          Evidence
        </h2>
        {turn ? (
          <>
            <p className="text-foreground/50 line-clamp-2 text-sm">
              <span className="sr-only">For the question: </span>“
              {turn.question}”
            </p>
            <MonoLabel>
              <PanelStatus turn={turn} />
            </MonoLabel>
          </>
        ) : (
          <p className="text-foreground/50 text-sm">
            Ask a question. Each claim in the answer links to the source that
            supports it.
          </p>
        )}
      </header>

      {turn && turn.status === 'pending' && (
        <div aria-hidden="true" className="space-y-3">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="border-foreground/10 h-28 animate-pulse rounded-xl border"
              style={{ animationDelay: `${index * 160}ms` }}
            />
          ))}
        </div>
      )}

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
