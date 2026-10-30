import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Square } from 'lucide-react'
import { citationChipClass } from '~/components/chat/AnswerMarkdown'
import VerdictBadge from '~/components/check/VerdictBadge'
import { Button } from '~/components/ui/button'
import { VERDICTS, VERDICT_INFO } from '~/lib/check/verdicts'
import { cn } from 'cn'

const BUTTON_VARIANTS = [
  [
    'default',
    'The main action of a view, in the brand color. One for each view.',
  ],
  ['outline', 'Other actions, such as Stop and Replay.'],
  [
    'secondary',
    'A quiet action next to the main one, such as Contact in the header.',
  ],
  ['ghost', 'Actions in toolbars and lists.'],
  ['destructive', 'Actions that delete or stop for good.'],
  ['link', 'Actions inside text.'],
] as const

function Group({
  children,
  note,
  title,
}: {
  children: ReactNode
  note: ReactNode
  title: string
}) {
  return (
    <div>
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      <p className="text-fg-muted mt-1 text-sm leading-6">{note}</p>
      <div className="border-foreground/15 bg-foreground/[0.015] mt-4 rounded-xl border p-4 sm:p-6">
        {children}
      </div>
    </div>
  )
}

function State({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      {children}
      <span className="text-fg-muted text-sm">{label}</span>
    </div>
  )
}

/** The shared components, each in the states it can be in. */
export default function ComponentStates() {
  return (
    <div className="space-y-12">
      <Group
        title="Button"
        note="Base UI button with the shadcn/ui base-nova styles. The focus state is the ring that keyboard focus shows. Disabled buttons that a stream turns off stay focusable, so focus is not lost."
      >
        <div className="divide-foreground/10 divide-y">
          {BUTTON_VARIANTS.map(([variant, use]) => (
            <div
              key={variant}
              className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center"
            >
              <div>
                <p className="text-foreground font-mono text-sm">{variant}</p>
                <p className="text-fg-muted text-sm leading-6">{use}</p>
              </div>
              <div className="flex flex-wrap gap-6">
                <State label="Rest">
                  <Button variant={variant}>Continue</Button>
                </State>
                <State label="Focus">
                  <Button
                    variant={variant}
                    tabIndex={-1}
                    className="border-ring ring-ring/50 ring-3"
                  >
                    Continue
                  </Button>
                </State>
                <State label="Disabled">
                  <Button variant={variant} disabled>
                    Continue
                  </Button>
                </State>
                <State label="With icon">
                  <Button variant={variant} tabIndex={-1}>
                    <Square className="fill-current" aria-hidden="true" />
                    Stop
                  </Button>
                </State>
              </div>
            </div>
          ))}
        </div>
      </Group>

      <Group
        title="Verdict badge"
        note="The five grades of the claim checker. Each has an icon, a label and a color, so color is never the only signal."
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {VERDICTS.map((verdict) => (
            <li key={verdict} className="space-y-2">
              <VerdictBadge verdict={verdict} />
              <p className="text-fg-muted text-sm leading-6">
                {VERDICT_INFO[verdict].description}
              </p>
            </li>
          ))}
        </ul>
      </Group>

      <Group
        title="Citation chip"
        note="A number in the answer text that opens its source. It is a toggle button: aria-pressed shows the source in view."
      >
        <div className="flex flex-wrap gap-8">
          {(
            [
              ['Rest', {}],
              ['Hover, or its source has the pointer', { hovered: true }],
              ['Active', { active: true }],
            ] as const
          ).map(([label, state]) => (
            <State key={label} label={label}>
              <p className="text-foreground text-base leading-7">
                Streams
                <span
                  aria-hidden="true"
                  className={cn(citationChipClass(state), 'cursor-default')}
                >
                  2
                </span>
              </p>
            </State>
          ))}
          <State label="Focus">
            <p className="text-foreground text-base leading-7">
              Streams
              <span
                aria-hidden="true"
                className={cn(
                  citationChipClass({}),
                  'ring-brand/70 cursor-default ring-2',
                )}
              >
                2
              </span>
            </p>
          </State>
        </div>
      </Group>

      <Group
        title="Streams, drawers and panels"
        note="The parts that change with time have every state on a control bar in the Lab: idle, loading, slow, streaming, interrupted, error and done."
      >
        <Link
          to="/lab"
          className="text-foreground hover:text-brand inline-flex items-center gap-2 text-base font-medium transition-colors"
        >
          Open the Lab
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Group>
    </div>
  )
}
