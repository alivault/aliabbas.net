import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from 'cn'
import LabAnswer from './LabAnswer'
import { useLabMotion } from './lab-motion'
import Specimen from './Specimen'
import { useLabStream } from './use-lab-stream'
import PathText from '~/components/PathText'
import { SPRINGS } from '~/lib/design/motion'

const ID = 'streaming-list'

function footnoteId(sourceId: string) {
  return `${ID}-note-${sourceId}`
}

export default function StreamingSpecimen() {
  const stream = useLabStream('done')
  const { reduce } = useLabMotion()
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null)
  const { turn } = stream

  const handleCite = useCallback((sourceId: string) => {
    setActiveSourceId(sourceId)
    requestAnimationFrame(() => {
      document.getElementById(footnoteId(sourceId))?.focus()
    })
  }, [])

  const run = stream.run
  const labStream = {
    ...stream,
    run: (scenario: Parameters<typeof run>[0]) => {
      setActiveSourceId(null)
      run(scenario)
    },
  }

  return (
    <Specimen
      id={ID}
      number="1"
      title="Streaming answer"
      stream={labStream}
      description="An answer that arrives token by token, with inline citations. It uses the chat's real renderer, citation filter and state machine. A local fake stream sends the tokens."
      notes={{
        states:
          'Idle, pending, streaming, complete, stopped and failed. Each forced state above moves the real machine into that state.',
        keyboard:
          'Tab to a citation chip. Its preview opens on focus. Enter moves focus to the source in the list. Esc stops a stream.',
        proves:
          'The text grows without layout jumps, a chip never shows before its source, and a stop or an error keeps the text that arrived.',
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <LabAnswer
          turn={turn}
          activeSourceId={activeSourceId}
          hoveredSourceId={hoveredSourceId}
          onCite={handleCite}
          onHover={setHoveredSourceId}
          onRetry={stream.retry}
        />
        <div className="xl:border-foreground/10 xl:border-l xl:pl-6">
          <h3 id={`${ID}-sources-label`} className="text-base font-semibold">
            Sources, in order of first citation
          </h3>
          {turn && turn.sources.length > 0 ? (
            <ol
              aria-labelledby={`${ID}-sources-label`}
              className="mt-3 space-y-2"
            >
              <AnimatePresence initial={false}>
                {turn.sources.map((source, index) => (
                  <motion.li
                    key={`${turn.attemptId}-${source.id}`}
                    layout={reduce ? false : 'position'}
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={SPRINGS.settle}
                  >
                    <p
                      id={footnoteId(source.id)}
                      tabIndex={-1}
                      onPointerEnter={() => setHoveredSourceId(source.id)}
                      onPointerLeave={() => setHoveredSourceId(null)}
                      className={cn(
                        'focus-visible:ring-brand/70 flex gap-2.5 rounded-lg border p-3 text-sm leading-5 transition-colors outline-none focus-visible:ring-2',
                        activeSourceId === source.id
                          ? 'border-brand bg-brand/[0.06]'
                          : hoveredSourceId === source.id
                            ? 'border-brand/50'
                            : 'border-foreground/10',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="border-foreground/20 flex size-6 shrink-0 items-center justify-center rounded-full border text-sm tabular-nums"
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="sr-only">Source {index + 1}: </span>
                        <span className="text-foreground block font-semibold">
                          {source.title}
                        </span>
                        <span className="text-foreground/55 mt-0.5 block font-mono text-sm [overflow-wrap:anywhere]">
                          <PathText path={source.group ?? ''} />
                        </span>
                      </span>
                    </p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          ) : (
            <p className="text-foreground/55 mt-3 text-sm leading-6">
              {stream.isActive
                ? 'Sources appear here as the answer cites them.'
                : 'No sources yet.'}
            </p>
          )}
        </div>
      </div>
    </Specimen>
  )
}
