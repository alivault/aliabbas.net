import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { cn } from 'cn'
import LabAnswer from './LabAnswer'
import { useLabMotion } from './lab-motion'
import Specimen, { SpecimenLabel } from './Specimen'
import { useLabStream } from './use-lab-stream'
import type { LabStream } from './use-lab-stream'
import { SPRINGS } from '~/lib/design/motion'

const ID = 'state-transition'

const PLACEMENTS = ['feed', 'dock'] as const
type Placement = (typeof PLACEMENTS)[number]
const PLACEMENT_LABELS: Record<Placement, string> = {
  feed: 'Feed',
  dock: 'Dock',
}

const SPRING = SPRINGS.layout

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
    <div role="radiogroup" aria-label="Card placement" className="flex gap-x-6">
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
            'hud-fill group/radio flex items-center gap-3 text-base leading-7',
            value === placement ? 'text-foreground' : 'text-fg-muted',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex size-3 shrink-0 items-center justify-center border transition-colors',
              value === placement ? 'border-hud' : 'border-fg-faint',
              'group-hover/radio:border-background group-focus-visible/radio:border-background',
            )}
          >
            <span
              className={cn(
                'size-1.5 transition-colors',
                value === placement
                  ? 'bg-hud group-hover/radio:bg-background group-focus-visible/radio:bg-background'
                  : 'bg-transparent',
              )}
            />
          </span>
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
        <h3 className="text-base font-semibold">Saved answer</h3>
        <span className="text-fg-muted text-sm tabular-nums">
          Mounted {mounts} {mounts === 1 ? 'time' : 'times'}, scrolled{' '}
          {Math.round(scrollTop)} px
        </span>
      </motion.header>

      <motion.div
        layout={reduce ? false : 'position'}
        transition={SPRING}
        tabIndex={0}
        role="group"
        aria-label="Answer, scrollable"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        className={cn(
          'focus-visible:ring-brand/70 overflow-y-auto rounded-lg outline-none focus-visible:ring-2',
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
          <legend className="text-fg-secondary text-sm font-medium">
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
                    'focus-visible:ring-brand/70 rounded-full border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-2',
                    pinned === source.id
                      ? 'border-brand bg-brand text-brand-foreground'
                      : 'border-foreground/15 text-fg-muted hover:text-foreground',
                  )}
                >
                  {index + 1}. {source.title}
                </button>
              ))
            ) : (
              <span className="text-fg-muted text-sm">No sources yet.</span>
            )}
          </div>
        </fieldset>
        <div className="min-w-0">
          <label
            htmlFor={noteId}
            className="text-fg-secondary text-sm font-medium"
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
        'border-foreground/10 text-fg-muted flex min-h-20 items-center rounded-xl border border-dashed px-4 text-sm',
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
      title="Moving card"
      stream={stream}
      description="Type a note or scroll, then move the card. Nothing resets."
      keys="Arrows in Placement move the card."
      controls={
        <div>
          <SpecimenLabel>Placement</SpecimenLabel>
          <PlacementGroup value={placement} onChange={setPlacement} />
          <p role="status" className="sr-only">
            Card in the {PLACEMENT_LABELS[placement].toLowerCase()}.
          </p>
        </div>
      }
    >
      <div>
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
