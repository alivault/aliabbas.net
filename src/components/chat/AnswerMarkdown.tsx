import { createContext, memo, use } from 'react'
import type { ComponentProps } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Title from '~/components/Title'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import type { ChatSource } from '~/lib/chat/protocol'
import { splitStreamingMarkdown } from '~/lib/chat/streaming-markdown'
import { cn } from 'cn'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type CitationContextValue = {
  sourceNumber: (sourceId: string) => number | undefined
  getSource: (sourceId: string) => ChatSource | undefined
  activeSourceId: string | null
  hoveredSourceId: string | null
  /** True while the answer streams. New chips animate in only then. */
  animateIn: boolean
  /**
   * Show a preview of the source on hover. Off when the evidence panel
   * already shows this answer, because the panel highlights the source.
   */
  preview: boolean
  /** The origin to show for a source without a link. */
  fallbackOrigin?: string
  onCite: (sourceId: string) => void
  onHover: (sourceId: string | null) => void
}

export const CitationContext = createContext<CitationContextValue | null>(null)

const CITE_HREF_PREFIX = '#cite-'

/** The first sentences of a source, for the preview card. */
function excerpt(body: string, maxLength = 220) {
  const text = body
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLength
    ? `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}…`
    : text
}

function hostname(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return href
  }
}

function CitationChip({ sourceId }: { sourceId: string }) {
  const context = use(CitationContext)
  const reduceMotion = useReducedMotion()
  const number = context?.sourceNumber(sourceId)
  const source = context?.getSource(sourceId)
  if (!context || number === undefined || !source) return null

  const active = context.activeSourceId === sourceId
  const hovered = context.hoveredSourceId === sourceId

  const chip = (
    <motion.button
      type="button"
      data-citation={sourceId}
      aria-label={`Source ${number}: ${source.title}`}
      aria-pressed={active}
      onClick={() => context.onCite(sourceId)}
      onPointerEnter={() => context.onHover(sourceId)}
      onPointerLeave={() => context.onHover(null)}
      onFocus={() => context.onHover(sourceId)}
      onBlur={() => context.onHover(null)}
      initial={
        context.animateIn && !reduceMotion ? { scale: 0.4, opacity: 0 } : false
      }
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}
      className={cn(
        'focus-visible:ring-brand/70 mx-0.5 inline-flex h-[1.2rem] min-w-[1.2rem] -translate-y-px cursor-pointer items-center justify-center rounded-full border px-1 align-middle font-mono text-[0.68rem] leading-none tabular-nums transition-colors outline-none focus-visible:ring-2',
        active
          ? 'border-brand bg-brand text-brand-foreground'
          : hovered
            ? 'border-brand/70 bg-brand/15 text-foreground'
            : 'border-foreground/20 text-foreground/70 hover:border-brand/70 hover:text-foreground',
      )}
    >
      {number}
    </motion.button>
  )

  if (!context.preview) return chip

  return (
    <HoverCard>
      <HoverCardTrigger delay={250} closeDelay={120} render={chip} />
      <HoverCardContent
        side="top"
        sideOffset={8}
        className="w-80 space-y-2 p-4"
      >
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="border-brand bg-brand text-brand-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[0.65rem] tabular-nums"
          >
            {number}
          </span>
          <div className="min-w-0">
            {source.group && (
              <p className="text-foreground/45 font-mono text-[10px] uppercase">
                {source.group}
              </p>
            )}
            <p className="text-foreground text-sm leading-5 font-semibold">
              {source.title}
            </p>
          </div>
        </div>
        <p className="text-foreground/65 text-[0.8rem] leading-5">
          {excerpt(source.body)}
        </p>
        <p className="text-foreground/40 flex items-center justify-between gap-3 font-mono text-[10px] uppercase">
          <span className="truncate">
            {source.href
              ? hostname(source.href)
              : (context.fallbackOrigin ?? 'Ali’s public record')}
          </span>
          <span className="shrink-0">Select to open</span>
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}

const markdownComponents: Components = {
  a: ({ children, href }) => {
    if (href?.startsWith(CITE_HREF_PREFIX)) {
      return <CitationChip sourceId={href.slice(CITE_HREF_PREFIX.length)} />
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline decoration-current/35 underline-offset-4 hover:decoration-current"
      >
        {children}
      </a>
    )
  },
  h1: ({ children }) => (
    <Title as="h3" variant="card" className="text-foreground">
      {children}
    </Title>
  ),
  h2: ({ children }) => (
    <Title as="h3" variant="subsection" className="text-foreground">
      {children}
    </Title>
  ),
  h3: ({ children }) => (
    <Title as="h4" variant="detail" className="text-foreground">
      {children}
    </Title>
  ),
  h4: ({ children }) => (
    <Title as="h5" variant="detail">
      {children}
    </Title>
  ),
  ul: ({ children }) => (
    <ul className="marker:text-brand list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="marker:text-brand list-decimal space-y-1 pl-5">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-brand/60 text-foreground/55 border-l pl-4">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => (
    <code
      className={cn(
        'bg-foreground/10 text-brand rounded px-1.5 py-0.5 font-mono text-[0.85em]',
        className,
      )}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="border-foreground/10 bg-muted overflow-x-auto rounded-lg border p-3 text-xs leading-6 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-foreground/20 text-foreground border-b px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-foreground/10 border-b px-3 py-2 align-top">
      {children}
    </td>
  ),
}

const remarkPlugins = [remarkGfm]

/**
 * Markers become links to `#cite-S4`, which the `a` renderer draws as chips.
 * A marker right after a bare URL gets a space first, or the GFM autolink
 * takes the marker into the URL.
 */
function linkCitations(markdown: string) {
  return markdown
    .replace(/(https?:\/\/[^\s<[]+)(?=\[S\d{1,3}\])/g, '$1 ')
    .replace(/\[(S\d{1,3})\]/g, `[$1](${CITE_HREF_PREFIX}$1)`)
}

const MarkdownChunk = memo(function MarkdownChunk({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      components={markdownComponents}
    >
      {linkCitations(text)}
    </ReactMarkdown>
  )
})

/**
 * Markdown split into blocks that parse alone. A finished block keeps its
 * text, so on each token only the last block parses again. The split stays
 * after the stream ends, so no block mounts again and no chip animates twice.
 */
export const AnswerMarkdown = memo(function AnswerMarkdown({
  text,
  className,
  ...props
}: { text: string } & ComponentProps<'div'>) {
  const chunks = splitStreamingMarkdown(text)
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {chunks.map((chunk, index) => (
        <MarkdownChunk key={index} text={chunk} />
      ))}
    </div>
  )
})
