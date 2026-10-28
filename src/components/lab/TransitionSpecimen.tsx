import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import MonoLabel from '~/components/MonoLabel'
import { cn } from 'cn'
import LabAnswer from './LabAnswer'
import { useLabMotion } from './lab-motion'
import Specimen from './Specimen'
import { useLabStream } from './use-lab-stream'
import type { LabStream } from './use-lab-stream'

const ID = 'state-transition'

const PLACEMENTS = ['feed', 'dock'] as const
type Placement = (typeof PLACEMENTS)[number]
const PLACEMENT_LABELS: Record<Placement, string> = {
  feed: 'Feed',
  dock: 'Dock',
}

const SPRING = { type: 'spring', stiffness: 380, damping: 36 } as const

function PlacementGroup({
  value,
  onChange,
}: {
  value: Placement
  onChange: (placement: Placement) => void
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return
    event.preventDefault()
    const next = index === 0 ? 1 : 0
    refs.current[next]?.focus()
    onChange(PLACEMENTS[next])
  }

  return (
    <div
      role="radiogroup"
      aria-label="Card placement"
      className="border-foreground/15 inline-flex rounded-full border p-0.5"
    >
      {PLACEMENTS.map((placement, index) => (
        <button
          key={placement}
          ref={(element) => {
            refs.current[index] = element
          }}
          type="button"
          role="radio"
          aria-checked={value === placement}
          tabIndex={value === placement ? 0 : -1}
          onClick={() => onChange(placement)}
          onKeyDown={(event) => onKeyDown(event, index)}
          className={cn(
            'focus-visible:ring-brand/70 rounded-full px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-2',
            value === placement
              ? 'bg-foreground text-background'
              : 'text-foreground/60 hover:text-foreground',
          )}
        >
          {PLACEMENT_LABELS[placement]}
        </button>
      ))}
    </div>
  )
}

/**
 * The card. It is the same element in both placements: only its grid
 * area changes, and Motion animates the move with a layout animation. So
 * React keeps its state and the browser keeps its scroll position.
 */
function SavedAnswerCard({
  placement,
  stream,
}: {
  placement: Placement
  stream: LabStream
}) {
  const { reduce } = useLabMotion()
  const [note, setNote] = useState('')
  const [pinned, setPinned] = useState<string | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [mounts, setMounts] = useState(0)
  const noteId = useId()
  const { turn } = stream
  const docked = placement === 'dock'

  // Counts mounts. A remount would reset this counter to 1 and clear the
  // note, the pin and the scroll position.
  useEffect(() => {
    setMounts((count) => count + 1)
  }, [])

  return (
    <motion.article
      layout={reduce ? false : true}
      transition={SPRING}
      aria-label="Saved answer"
      className={cn(
        'border-brand/60 bg-background flex min-w-0 flex-col gap-4 rounded-xl border p-4',
        docked
          ? 'order-last lg:order-none lg:col-start-2 lg:row-span-3 lg:row-start-1'
          : 'order-first lg:order-none lg:col-start-1 lg:row-start-1',
      )}
    >
      <motion.header
        layout={reduce ? false : 'position'}
        transition={SPRING}
        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
      >
        <MonoLabel tone="brand">Saved answer</MonoLabel>
        <MonoLabel as="span" className="tabular-nums">
          Mounted {mounts} {mounts === 1 ? 'time' : 'times'} · scroll{' '}
          {Math.round(scrollTop)} px
        </MonoLabel>
      </motion.header>

      <motion.div
        layout={reduce ? false : 'position'}
        transition={SPRING}
        tabIndex={0}
        role="group"
        aria-label="Answer, scrollable"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        className={cn(
          'focus-visible:ring-brand/70 overflow-y-auto overscroll-contain rounded-lg outline-none focus-visible:ring-2',
          docked ? 'h-56' : 'h-40',
        )}
      >
        <LabAnswer
          turn={turn}
          onRetry={stream.retry}
          hideQuestion
          preview={false}
        />
      </motion.div>

      <motion.div
        layout={reduce ? false : 'position'}
        transition={SPRING}
        className={cn('grid gap-4', !docked && 'sm:grid-cols-2')}
      >
        <fieldset className="min-w-0">
          <legend className="text-foreground/40 font-mono text-[11px] uppercase">
            Pin a source
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {turn && turn.sources.length > 0 ? (
              turn.sources.map((source, index) => (
                <button
                  key={source.id}
                  type="button"
                  aria-pressed={pinned === source.id}
                  onClick={() =>
                    setPinned((value) =>
                      value === source.id ? null : source.id,
                    )
                  }
                  className={cn(
                    'focus-visible:ring-brand/70 rounded-full border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2',
                    pinned === source.id
                      ? 'border-brand bg-brand text-brand-foreground'
                      : 'border-foreground/15 text-foreground/60 hover:text-foreground',
                  )}
                >
                  {index + 1}. {source.title}
                </button>
              ))
            ) : (
              <span className="text-foreground/40 text-xs">
                No sources yet.
              </span>
            )}
          </div>
        </fieldset>
        <div className="min-w-0">
          <label
            htmlFor={noteId}
            className="text-foreground/40 font-mono text-[11px] uppercase"
          >
            Your note
          </label>
          <input
            id={noteId}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Type here, then move the card"
            className="border-foreground/15 focus-visible:border-brand focus-visible:ring-brand/40 mt-2 h-9 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-2"
          />
        </div>
      </motion.div>
    </motion.article>
  )
}

function Placeholder({
  className,
  label,
}: {
  className?: string
  label: string
}) {
  const { reduce } = useLabMotion()
  return (
    <motion.div
      layout={reduce ? false : true}
      transition={SPRING}
      aria-hidden="true"
      className={cn(
        'border-foreground/10 text-foreground/30 flex min-h-20 items-center rounded-xl border border-dashed px-4 font-mono text-[11px] uppercase',
        className,
      )}
    >
      {label}
    </motion.div>
  )
}

export default function TransitionSpecimen() {
  const stream = useLabStream('done')
  const [placement, setPlacement] = useState<Placement>('feed')

  return (
    <Specimen
      id={ID}
      number="04"
      title="A move that keeps state"
      stream={stream}
      description="A card moves between the feed and a side dock. Type a note, pin a source, or scroll the answer, then move the card. Start a slow stream and move it while the text arrives."
      notes={{
        states:
          'Feed or dock, combined with every answer state. The stream, the note, the pin and the scroll position all survive the move.',
        keyboard:
          'Tab to “Card placement”. Arrow keys move the card. Tab into the card to type a note, pin a source with Enter or Space, and scroll the answer with the arrow keys.',
        proves:
          'The move is a layout animation on one element, not an unmount and a mount. The mount counter stays at 1. With reduced motion, the card jumps to its new place, with the same state.',
      }}
    >
      <div className="space-y-4">
        <PlacementGroup value={placement} onChange={setPlacement} />
        <p role="status" className="sr-only">
          Card in the {PLACEMENT_LABELS[placement].toLowerCase()}.
        </p>
        <LayoutGroup id={ID}>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-[auto_auto_auto]">
            <SavedAnswerCard placement={placement} stream={stream} />
            <Placeholder
              label="Feed item"
              className={cn(
                'lg:col-start-1',
                placement === 'feed' ? 'lg:row-start-2' : 'lg:row-start-1',
              )}
            />
            <Placeholder
              label="Feed item"
              className={cn(
                'lg:col-start-1',
                placement === 'feed' ? 'lg:row-start-3' : 'lg:row-start-2',
              )}
            />
            {placement === 'feed' && (
              <Placeholder
                label="Dock is empty"
                className="hidden lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:flex"
              />
            )}
          </div>
        </LayoutGroup>
      </div>
    </Specimen>
  )
}
