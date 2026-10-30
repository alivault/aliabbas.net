import { useState } from 'react'
import { motion } from 'motion/react'
import { Play } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { DURATIONS, EASE_IN, EASE_OUT, SPRINGS } from '~/lib/design/motion'
import type { SpringName } from '~/lib/design/motion'
import { cn } from 'cn'

const SPRING_USE: Record<SpringName, string> = {
  layout: 'Panels and cards that move or resize.',
  settle: 'List items that enter, and indicators that slide.',
  pop: 'Citation chips and counts that appear.',
  bloom: 'Decorative pieces on the home page that bloom in.',
  hover: 'Decorative pieces that answer the pointer.',
}

const DURATION_USE: Record<keyof typeof DURATIONS, string> = {
  enter: 'A message or panel that enters.',
  exit: 'Something that leaves.',
  page: 'A view that replaces another.',
  reveal: 'Content that scrolls into view, and the mobile menu.',
  showcase: 'Large decorative pieces on the home page.',
}

/** Each spring moves a dot across a track. Reduced motion makes it jump. */
export default function MotionTokens() {
  const [ends, setEnds] = useState<Partial<Record<SpringName, boolean>>>({})
  const names = Object.keys(SPRINGS) as Array<SpringName>
  const playAll = () =>
    setEnds((current) => {
      const end = !current.layout
      return Object.fromEntries(names.map((name) => [name, end]))
    })

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-foreground text-base font-semibold">Springs</h3>
        <Button variant="outline" onClick={playAll}>
          <Play aria-hidden="true" />
          Play all
        </Button>
      </div>
      <ul className="border-foreground/10 -mt-6 border-t">
        {names.map((name) => {
          const spring = SPRINGS[name]
          return (
            <li
              key={name}
              className="border-foreground/10 grid gap-3 border-b py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-6"
            >
              <button
                type="button"
                onClick={() =>
                  setEnds((current) => ({ ...current, [name]: !current[name] }))
                }
                className="group focus-visible:ring-ring/50 rounded-lg text-left outline-none focus-visible:ring-3"
              >
                <span className="text-foreground group-hover:text-brand block font-mono text-sm transition-colors">
                  SPRINGS.{name}
                </span>
                <span className="text-fg-muted block text-sm tabular-nums">
                  Stiffness {spring.stiffness}, damping {spring.damping}
                </span>
                <span className="sr-only">. Play this spring.</span>
              </button>
              <div className="space-y-2">
                <div
                  aria-hidden="true"
                  className={cn(
                    'bg-foreground/[0.04] border-foreground/10 flex h-10 items-center rounded-full border px-1',
                    ends[name] ? 'justify-end' : 'justify-start',
                  )}
                >
                  <motion.span
                    layout
                    transition={spring}
                    className="bg-brand block size-8 rounded-full"
                  />
                </div>
                <p className="text-fg-muted text-sm leading-6">
                  {SPRING_USE[name]}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <div>
        <h3 className="text-foreground text-base font-semibold">
          Eases and durations
        </h3>
        <dl className="border-foreground/10 mt-4 grid gap-x-6 border-t sm:grid-cols-2">
          {[
            [
              'EASE_OUT',
              `cubic-bezier(${EASE_OUT.join(', ')})`,
              'Things that enter.',
            ],
            [
              'EASE_IN',
              `cubic-bezier(${EASE_IN.join(', ')})`,
              'Things that leave.',
            ],
            ...Object.entries(DURATIONS).map(([name, seconds]) => [
              `DURATIONS.${name}`,
              `${Math.round(seconds * 1000)} ms`,
              DURATION_USE[name as keyof typeof DURATIONS],
            ]),
          ].map(([name, value, use]) => (
            <div key={name} className="border-foreground/10 border-b py-4">
              <dt className="text-foreground font-mono text-sm">{name}</dt>
              <dd className="text-fg-muted text-sm leading-6 tabular-nums">
                {value} · {use}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
