import { memo, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Check,
  CircleAlert,
  Copy,
  FileSearch,
  Pencil,
  RotateCcw,
  Square,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { isActive } from '~/lib/chat/chat-machine'
import type { Turn } from '~/lib/chat/chat-machine'
import { answerToPlainText } from '~/lib/chat/streaming-markdown'
import { cn } from 'cn'
import { AnswerMarkdown, CitationContext } from './AnswerMarkdown'
import type { CitationContextValue } from './AnswerMarkdown'

function formatDuration(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

function ThinkingDots() {
  return (
    <span className="flex h-7 items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="bg-brand size-1.5 animate-pulse rounded-full motion-reduce:animate-none"
          style={{ animationDelay: `${dot * 140}ms` }}
        />
      ))}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timeout)
  }, [copied])

  return (
    <Button
      variant="ghost"
      size="default"
      onClick={() => {
        void navigator.clipboard
          .writeText(text)
          .then(() => setCopied(true))
          .catch(() => undefined)
      }}
      className="text-fg-muted hover:text-foreground"
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </Button>
  )
}

function TurnStatusLine({ turn }: { turn: Turn }) {
  if (turn.status === 'streaming') {
    return (
      <span className="flex items-center gap-2">
        <span className="bg-brand size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
        Writing
      </span>
    )
  }
  if (turn.status === 'complete') {
    const metrics =
      turn.firstTokenAt !== undefined && turn.endedAt !== undefined
        ? `First token ${formatDuration(turn.firstTokenAt - turn.startedAt)} · done in ${formatDuration(turn.endedAt - turn.startedAt)}`
        : ''
    return turn.sources.length === 0 ? (
      <span className="flex items-center gap-1.5">
        <CircleAlert className="size-3" aria-hidden="true" />
        No sources cited{metrics && ` · ${metrics}`}
      </span>
    ) : (
      <span>{metrics}</span>
    )
  }
  if (turn.status === 'stopped') {
    return (
      <span className="flex items-center gap-1.5">
        <Square className="size-2.5 fill-current" aria-hidden="true" />
        {turn.answer ? 'Stopped' : 'Stopped before the answer started'}
      </span>
    )
  }
  return null
}

export type ChatTurnProps = {
  turn: Turn
  isLast: boolean
  showsEvidence: boolean
  /** The evidence panel is open and shows this answer. */
  evidenceVisible: boolean
  activeSourceId: string | null
  hoveredSourceId: string | null
  onCite: (turnId: string, sourceId: string) => void
  onHover: (turnId: string, sourceId: string | null) => void
  onToggleEvidence: (turnId: string) => void
  onRetry: (turnId: string) => void
  onEdit: (turn: Turn) => void
}

function ChatTurn({
  turn,
  isLast,
  showsEvidence,
  evidenceVisible,
  activeSourceId,
  hoveredSourceId,
  onCite,
  onHover,
  onToggleEvidence,
  onRetry,
  onEdit,
}: ChatTurnProps) {
  const active = isActive(turn)
  const questionId = `${turn.id}-question`

  const citationContext = useMemo<CitationContextValue>(() => {
    const numbers = new Map(
      turn.sources.map((source, index) => [source.id, index + 1]),
    )
    const byId = new Map(turn.sources.map((source) => [source.id, source]))
    return {
      sourceNumber: (id) => numbers.get(id),
      getSource: (id) => byId.get(id),
      activeSourceId: showsEvidence ? activeSourceId : null,
      hoveredSourceId: showsEvidence ? hoveredSourceId : null,
      animateIn: active,
      preview: !evidenceVisible,
      onCite: (id) => onCite(turn.id, id),
      onHover: (id) => onHover(turn.id, id),
    }
  }, [
    turn.id,
    turn.sources,
    showsEvidence,
    evidenceVisible,
    activeSourceId,
    hoveredSourceId,
    active,
    onCite,
    onHover,
  ])

  const copyText = useMemo(() => {
    if (active || !turn.answer) return ''
    const plain = answerToPlainText(turn.answer, (id) =>
      citationContext.sourceNumber(id),
    )
    const sources = turn.sources
      .map(
        (source, index) =>
          `[${index + 1}] ${source.title}${source.href ? ` — ${source.href}` : ''}`,
      )
      .join('\n')
    return sources ? `${plain}\n\nSources:\n${sources}` : plain
  }, [active, turn.answer, turn.sources, citationContext])

  return (
    <article
      aria-labelledby={questionId}
      aria-busy={active}
      className="flex flex-col gap-7"
    >
      <div className="flex flex-row-reverse gap-3 pl-8 sm:pl-16">
        <h2 id={questionId} className="sr-only">
          You asked: {turn.question}
        </h2>
        <p
          aria-hidden="true"
          className="bg-brand text-brand-foreground max-w-[min(100%,42rem)] rounded-2xl rounded-tr-sm px-4 py-2.5 text-base leading-7 whitespace-pre-wrap"
        >
          {turn.question}
        </p>
      </div>

      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="border-foreground/15 text-brand flex size-7 shrink-0 items-center justify-center rounded-full border"
        >
          <Bot className="size-3.5" />
        </span>
        <div className="flex max-w-[min(100%,42rem)] min-w-0 flex-1 flex-col gap-3 pt-0.5">
          <p className="sr-only">Answer:</p>
          {turn.answer ? (
            <CitationContext value={citationContext}>
              <AnswerMarkdown
                text={turn.answer}
                className={cn(
                  'text-fg-secondary text-base leading-7',
                  (turn.status === 'stopped' || turn.status === 'failed') &&
                    'text-fg-muted',
                )}
              />
            </CitationContext>
          ) : turn.status === 'pending' ? (
            <>
              <ThinkingDots />
              <span className="sr-only">Generating answer</span>
            </>
          ) : null}

          {turn.status === 'failed' && (
            <p
              role="alert"
              className="text-destructive flex items-start gap-2 text-sm"
            >
              <CircleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {turn.error}
            </p>
          )}

          {turn.status !== 'pending' && (
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
              <span className="text-fg-muted mr-2 text-sm tabular-nums">
                <TurnStatusLine turn={turn} />
              </span>
              {turn.sources.length > 0 && (
                <Button
                  variant="ghost"
                  size="default"
                  aria-pressed={evidenceVisible}
                  aria-label={`${turn.sources.length} ${turn.sources.length === 1 ? 'source' : 'sources'}: ${evidenceVisible ? 'hide' : 'show'} evidence`}
                  onClick={() => onToggleEvidence(turn.id)}
                  className="text-fg-muted hover:text-foreground"
                >
                  <FileSearch aria-hidden="true" />
                  <span className="tabular-nums">{turn.sources.length}</span>
                  {turn.sources.length === 1 ? 'source' : 'sources'}
                </Button>
              )}
              {copyText && <CopyButton text={copyText} />}
              {isLast && !active && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => onRetry(turn.id)}
                  className="text-fg-muted hover:text-foreground"
                >
                  <RotateCcw aria-hidden="true" />
                  {turn.status === 'complete' ? 'Regenerate' : 'Retry'}
                </Button>
              )}
              {isLast &&
                (turn.status === 'failed' || turn.status === 'stopped') && (
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => onEdit(turn)}
                    className="text-fg-muted hover:text-foreground"
                  >
                    <Pencil aria-hidden="true" />
                    Edit question
                  </Button>
                )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default memo(ChatTurn)
