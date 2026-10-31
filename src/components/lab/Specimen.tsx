import { useId } from 'react'
import type { ReactNode } from 'react'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { cn } from 'cn'
import StateBar from './StateBar'
import type { LabStream } from './use-lab-stream'

export type SpecimenNotes = {
  states: ReactNode
  keyboard: ReactNode
  proves: ReactNode
}

/**
 * The frame for one specimen: a title, the control bar, the live stage
 * and notes. Esc in the specimen stops its stream. Esc in a portal, such
 * as the drawer, is left to the portal.
 */
export default function Specimen({
  children,
  description,
  id,
  notes,
  number,
  stream,
  title,
  wide = false,
}: {
  children: ReactNode
  description: ReactNode
  id: string
  notes: SpecimenNotes
  number: string
  stream: LabStream
  title: string
  /** Give the stage the full width, with the notes above it. */
  wide?: boolean
}) {
  const headingId = useId()

  return (
    <ScrollReveal amount={0.02}>
      <section
        id={id}
        aria-labelledby={headingId}
        className={cn(
          'grid scroll-mt-21 gap-8 lg:scroll-mt-45 lg:gap-x-12',
          wide
            ? 'lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)]'
            : 'lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr]',
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
        <header className="space-y-4 lg:col-start-1 lg:row-start-1">
          <Title as="h2" variant="card" id={headingId} className="text-balance">
            <span className="tabular-nums">{number}.</span> {title}
          </Title>
          <p className="text-fg-muted text-base leading-7">{description}</p>
        </header>
        <div
          className={cn(
            'border-foreground/15 bg-foreground/[0.015] min-w-0 self-start rounded-xl border p-4 sm:p-6',
            wide
              ? 'lg:col-span-2 lg:row-start-2'
              : 'lg:col-start-2 lg:row-span-2 lg:row-start-1',
          )}
        >
          <StateBar label={title} stream={stream} />
          <div className="pt-6">{children}</div>
        </div>
        <dl
          className={cn(
            'text-fg-muted text-base leading-7',
            wide
              ? 'grid gap-4 sm:grid-cols-3 lg:col-start-2 lg:row-start-1 lg:self-end'
              : 'space-y-4 lg:col-start-1 lg:row-start-2',
          )}
        >
          <div>
            <dt className="text-foreground inline font-semibold">States. </dt>
            <dd className="inline">{notes.states}</dd>
          </div>
          <div>
            <dt className="text-foreground inline font-semibold">Keyboard. </dt>
            <dd className="inline">{notes.keyboard}</dd>
          </div>
          <div>
            <dt className="text-foreground inline font-semibold">
              What it proves.{' '}
            </dt>
            <dd className="inline">{notes.proves}</dd>
          </div>
        </dl>
      </section>
    </ScrollReveal>
  )
}
