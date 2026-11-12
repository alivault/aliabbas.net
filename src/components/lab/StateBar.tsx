import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { RotateCcw, Square } from 'lucide-react'
import { LAB_SCENARIOS, LAB_SCENARIO_LABELS } from '~/lib/lab/fake-stream'
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
export function StateTrack({ state }: { state: LabMachineState }) {
  const node = (name: LabMachineState) => (
    <span
      key={name}
      className={cn(
        'font-hud border px-2 py-0.5 text-sm tracking-[0.2em] uppercase transition-colors',
        state === name
          ? name === 'failed'
            ? 'border-destructive bg-destructive text-background'
            : 'border-hud bg-hud text-background'
          : 'border-hud/20 text-hud/50',
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
    <div
      role="radiogroup"
      aria-label={label}
      className="font-hud flex flex-wrap gap-x-5 gap-y-2 text-sm tracking-[0.2em]"
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
              'hud-fill uppercase',
              checked ? 'bg-hud text-background' : 'text-hud/70',
            )}
          >
            {LAB_SCENARIO_LABELS[scenario]}
          </button>
        )
      })}
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
    <div className="border-hud/20 flex flex-col gap-4 border-b pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <ScenarioRadioGroup
          label={`Force a state: ${label}`}
          value={scenario}
          onChange={run}
        />
        <div className="font-hud text-hud flex shrink-0 items-center gap-6 text-sm tracking-[0.3em]">
          <button
            type="button"
            className="hud-fill flex items-center gap-2 uppercase aria-disabled:opacity-40"
            onClick={() => {
              if (isActive) stop()
            }}
            // aria-disabled, not disabled: focus stays on Stop when the
            // stream ends, so it is not lost.
            aria-disabled={!isActive}
            data-lab-stop=""
            aria-keyshortcuts="Escape"
          >
            <Square className="size-3.5 fill-current" aria-hidden="true" />
            Stop
          </button>
          <button
            type="button"
            className="hud-fill flex items-center gap-2 uppercase"
            onClick={() => run(scenario)}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Replay
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-hud text-hud text-sm tracking-[0.3em] uppercase">
          Machine state
        </span>
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
