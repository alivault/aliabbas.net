import { useId } from 'react'
import type { ReactNode } from 'react'
import ScrollReveal from '~/components/ScrollReveal'
import { cn } from 'cn'
import StateBar from './StateBar'
import type { LabStream } from './use-lab-stream'

/**
 * The frame for one specimen: a title, the control bar and the live
 * stage. Esc in the specimen stops its stream. Esc in a portal, such
 * as the drawer, is left to the portal.
 */
export default function Specimen({
  children,
  description,
  id,
  keys,
  stream,
  title,
  wide = false,
}: {
  children: ReactNode
  description: ReactNode
  id: string
  /** A short line on the keyboard path. */
  keys: ReactNode
  stream: LabStream
  title: string
  /** Give the stage the full width, below the title. */
  wide?: boolean
}) {
  const headingId = useId()

  return (
    <ScrollReveal amount={0.02}>
      <section
        id={id}
        aria-labelledby={headingId}
        className={cn(
          'grid scroll-mt-21 gap-8 lg:scroll-mt-44 lg:gap-x-12',
          !wide && 'lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)]',
        )}
        onKeyDown={(event) => {
          if (
            event.key !== 'Escape' ||
            event.defaultPrevented ||
            !stream.isActive ||
            !(event.target instanceof Node) ||
            !event.currentTarget.contains(event.target)
          ) {
            return
          }
          event.preventDefault()
          stream.stop()
        }}
      >
        <header className={cn('space-y-3', wide && 'max-w-2xl')}>
          <h2
            id={headingId}
            className="font-hud text-hud text-sm leading-[2.2] tracking-[0.42em] text-balance uppercase"
          >
            {title}
          </h2>
          <p className="text-fg-secondary text-base leading-7">{description}</p>
          <p className="text-fg-muted text-sm leading-6">
            <span className="font-hud text-hud mr-2 tracking-[0.3em] uppercase">
              Keys
            </span>
            {keys}
          </p>
        </header>
        <div className="border-hud/25 bg-background/60 min-w-0 self-start border p-4 backdrop-blur-[20px] sm:p-6">
          <StateBar label={title} stream={stream} />
          <div className="pt-6">{children}</div>
        </div>
      </section>
    </ScrollReveal>
  )
}
