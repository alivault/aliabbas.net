import { useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { RotateCcw, Square } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  LAB_SCENARIOS,
  LAB_SCENARIO_HINTS,
  LAB_SCENARIO_LABELS,
} from '~/lib/lab/fake-stream'
import type { LabScenario } from '~/lib/lab/fake-stream'
import { cn } from 'cn'
import type { LabMachineState, LabStream } from './use-lab-stream'

const MACHINE_STATES: ReadonlyArray<LabMachineState> = [
  'idle',
  'pending',
  'streaming',
  'complete',
  'stopped',
  'failed',
]

/**
 * The machine as a strip of states. The current state is filled. The
 * three end states share one column, because a turn reaches only one.
 */
function StateTrack({ state }: { state: LabMachineState }) {
  const node = (name: LabMachineState) => (
    <span
      key={name}
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-sm capitalize transition-colors',
        state === name
          ? name === 'failed'
            ? 'border-destructive bg-destructive text-white'
            : 'border-brand bg-brand text-brand-foreground'
          : 'border-foreground/15 text-fg-faint',
      )}
    >
      {name}
    </span>
  )
  const arrow = (
    <span aria-hidden="true" className="text-fg-faint text-sm">
      →
    </span>
  )

  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-1.5">
      {node('idle')}
      {arrow}
      {node('pending')}
      {arrow}
      {node('streaming')}
      {arrow}
      <span className="flex flex-wrap gap-1">
        {MACHINE_STATES.slice(3).map(node)}
      </span>
    </div>
  )
}

/**
 * Force a state with a radio group. Arrow keys move and select, as in a
 * native radio group, and Tab leaves the group.
 */
function ScenarioRadioGroup({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (scenario: LabScenario) => void
  value: LabScenario
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const hintId = useId()

  const move = (event: KeyboardEvent, index: number) => {
    const last = LAB_SCENARIOS.length - 1
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    refs.current[next]?.focus()
    onChange(LAB_SCENARIOS[next])
  }

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={hintId}
        className="flex flex-wrap gap-1.5"
      >
        {LAB_SCENARIOS.map((scenario, index) => {
          const checked = scenario === value
          return (
            <button
              key={scenario}
              ref={(element) => {
                refs.current[index] = element
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(scenario)}
              onKeyDown={(event) => move(event, index)}
              className={cn(
                'focus-visible:ring-brand/70 focus-visible:ring-offset-background rounded-full border px-3.5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                checked
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-foreground/15 text-fg-muted hover:border-foreground/40 hover:text-foreground',
              )}
            >
              {LAB_SCENARIO_LABELS[scenario]}
            </button>
          )
        })}
      </div>
      <p id={hintId} className="text-fg-muted text-sm">
        {LAB_SCENARIO_HINTS[value]}
      </p>
    </div>
  )
}

const STATE_ANNOUNCEMENTS: Record<LabMachineState, string> = {
  idle: 'Idle. No answer.',
  pending: 'Loading. Waiting for the first token.',
  streaming: 'Streaming.',
  complete: 'Done.',
  stopped: 'Stopped.',
  failed: 'Failed.',
}

export default function StateBar({
  label,
  stream,
}: {
  /** The specimen name, for the radio group label. */
  label: string
  stream: LabStream
}) {
  const { machineState, isActive, run, scenario, stop, turn } = stream

  return (
    <div className="border-foreground/10 flex flex-col gap-4 border-b pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <ScenarioRadioGroup
          label={`Force a state: ${label}`}
          value={scenario}
          onChange={run}
        />
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="default"
            onClick={stop}
            disabled={!isActive}
            // Focus stays on Stop when the stream ends, so it is not lost.
            focusableWhenDisabled
            data-lab-stop=""
            aria-keyshortcuts="Escape"
          >
            <Square className="fill-current" aria-hidden="true" />
            Stop
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={() => run(scenario)}
          >
            <RotateCcw aria-hidden="true" />
            Replay
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-fg-muted text-sm">Machine state</span>
        <StateTrack state={machineState} />
        <p role="status" className="sr-only">
          {STATE_ANNOUNCEMENTS[machineState]}
          {turn && !isActive
            ? ` ${turn.sources.length} ${turn.sources.length === 1 ? 'source' : 'sources'} cited.`
            : ''}
        </p>
      </div>
    </div>
  )
}
