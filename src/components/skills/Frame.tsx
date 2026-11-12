import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from 'cn'

/** The frame of each example: a card with a caption under it. */
export default function Frame({
  caption,
  children,
  className,
  onKeyDown,
}: {
  caption: ReactNode
  children: ReactNode
  className?: string
  onKeyDown?: (event: KeyboardEvent) => void
}) {
  return (
    <figure className="min-w-0">
      <div
        onKeyDown={onKeyDown}
        className={cn(
          'border-border bg-card flex min-h-56 flex-col rounded-xl border p-5',
          className,
        )}
      >
        {children}
      </div>
      <figcaption className="text-fg-muted mt-3 text-sm leading-6">
        {caption}
      </figcaption>
    </figure>
  )
}
