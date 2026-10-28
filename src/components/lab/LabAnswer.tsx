import { useMemo } from 'react'
import { Bot, CircleAlert, RotateCcw, Square } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  AnswerMarkdown,
  CitationContext,
} from '~/components/chat/AnswerMarkdown'
import type { CitationContextValue } from '~/components/chat/AnswerMarkdown'
import { isActive } from '~/lib/chat/chat-machine'
import type { Turn } from '~/lib/chat/chat-machine'
import { cn } from 'cn'

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

export type LabAnswerProps = {
  turn: Turn | undefined
  activeSourceId?: string | null
  hoveredSourceId?: string | null
  /** Show a hover card for each chip. */
  preview?: boolean
  onCite?: (sourceId: string) => void
  onHover?: (sourceId: string | null) => void
  onRetry: (turnId: string) => void
  /** Hide the question bubble, for small stages. */
  hideQuestion?: boolean
  className?: string
}

/**
 * One answer, drawn with the same parts as the chat: AnswerMarkdown with
 * citation chips. The text region is a polite live region. It is busy
 * while the answer streams, so a screen reader reads it once, at the end.
 */
export default function LabAnswer({
  turn,
  activeSourceId = null,
  hoveredSourceId = null,
  preview = true,
  onCite,
  onHover,
  onRetry,
  hideQuestion = false,
  className,
}: LabAnswerProps) {
  const active = turn ? isActive(turn) : false

  const citationContext = useMemo<CitationContextValue | null>(() => {
    if (!turn) return null
    const numbers = new Map(
      turn.sources.map((source, index) => [source.id, index + 1]),
    )
    const byId = new Map(turn.sources.map((source) => [source.id, source]))
    return {
      sourceNumber: (id) => numbers.get(id),
      getSource: (id) => byId.get(id),
      activeSourceId,
      hoveredSourceId,
      animateIn: active,
      preview,
      fallbackOrigin: 'This site’s source code',
      onCite: (id) => onCite?.(id),
      onHover: (id) => onHover?.(id),
    }
  }, [turn, activeSourceId, hoveredSourceId, active, preview, onCite, onHover])

  if (!turn || !citationContext) {
    return (
      <div
        className={cn(
          'border-foreground/15 text-foreground/45 flex min-h-32 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm',
          className,
        )}
      >
        No answer yet. Pick a state above to start a stream.
      </div>
    )
  }

  const metrics =
    turn.status === 'complete' &&
    turn.firstTokenAt !== undefined &&
    turn.endedAt !== undefined &&
    turn.endedAt > turn.startedAt
      ? `First token ${formatDuration(turn.firstTokenAt - turn.startedAt)} · done in ${formatDuration(turn.endedAt - turn.startedAt)}`
      : null

  return (
    <article
      aria-busy={active}
      className={cn('flex flex-col gap-5', className)}
    >
      {!hideQuestion && (
        <div className="flex justify-end pl-8">
          <p className="bg-brand text-brand-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm leading-6">
            <span className="sr-only">Question: </span>
            {turn.question}
          </p>
        </div>
      )}
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="border-foreground/15 text-brand flex size-7 shrink-0 items-center justify-center rounded-full border"
        >
          <Bot className="size-3.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
          <div aria-live="polite" aria-busy={active} aria-atomic="false">
            {turn.answer ? (
              <CitationContext value={citationContext}>
                <AnswerMarkdown
                  text={turn.answer}
                  className={cn(
                    'text-foreground/70 text-[0.95rem] leading-7',
                    (turn.status === 'stopped' || turn.status === 'failed') &&
                      'text-foreground/55',
                  )}
                />
              </CitationContext>
            ) : turn.status === 'pending' ? (
              <>
                <ThinkingDots />
                <span className="sr-only">Generating answer</span>
              </>
            ) : null}
          </div>

          {turn.status === 'failed' && (
            <div className="flex flex-wrap items-center gap-3">
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
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  // The Retry button goes away. Focus moves to Stop, so Esc
                  // and Tab still work from the specimen.
                  const specimen = event.currentTarget.closest('section')
                  onRetry(turn.id)
                  requestAnimationFrame(() => {
                    specimen
                      ?.querySelector<HTMLElement>('[data-lab-stop]')
                      ?.focus()
                  })
                }}
              >
                <RotateCcw aria-hidden="true" />
                Retry
              </Button>
            </div>
          )}

          {turn.status === 'stopped' && (
            <p className="text-foreground/40 flex items-center gap-1.5 font-mono text-[11px] uppercase">
              <Square className="size-2.5 fill-current" aria-hidden="true" />
              {turn.answer ? 'Stopped' : 'Stopped before the answer started'}
            </p>
          )}

          {turn.status === 'streaming' && (
            <p className="text-foreground/40 flex items-center gap-2 font-mono text-[11px] uppercase">
              <span className="bg-brand size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
              Writing · Esc stops
            </p>
          )}

          {metrics && (
            <p className="text-foreground/40 font-mono text-[11px] uppercase">
              {metrics}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
