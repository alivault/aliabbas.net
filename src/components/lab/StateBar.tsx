import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { RotateCcw, Square } from 'lucide-react'
import { LAB_SCENARIOS, LAB_SCENARIO_LABELS } from '~/lib/lab/fake-stream'
import type { LabScenario } from '~/lib/lab/fake-stream'
import { cn } from 'cn'
import type { LabMachineState, LabStream } from './use-lab-stream'

/**
 * The machine as a list of its states, by their names in the code. The
 * current state is lit. The three end states share one line, because a
 * turn reaches only one of them.
 */
export function StateTrack({ state }: { state: LabMachineState }) {
  const node = (name: LabMachineState) => (
    <span
      key={name}
      className={cn(
        'transition-colors',
        state === name
          ? name === 'failed'
            ? 'text-destructive'
            : 'text-hud'
          : 'text-fg-faint',
      )}
    >
      {name}
    </span>
  )

  return (
    <ol aria-hidden="true" className="font-mono text-sm leading-7">
      {(['idle', 'pending', 'streaming'] as const).map((name) => (
        <li key={name} className="flex items-center gap-2">
          <Dot on={state === name} />
          {node(name)}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <Dot
          on={state === 'complete' || state === 'stopped' || state === 'failed'}
          failed={state === 'failed'}
        />
        <span className="flex gap-2">
          {node('complete')}
          <span className="text-fg-faint">|</span>
          {node('stopped')}
          <span className="text-fg-faint">|</span>
          {node('failed')}
        </span>
      </li>
    </ol>
  )
}

function Dot({ on, failed = false }: { on: boolean; failed?: boolean }) {
  return (
    <span
      className={cn(
        'size-1.5 shrink-0 transition-colors',
        on ? (failed ? 'bg-destructive' : 'bg-hud') : 'bg-fg-faint/40',
      )}
    />
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
      className="flex flex-wrap gap-x-5 gap-y-1 lg:flex-col lg:items-start"
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
              'hud-fill group/radio flex items-center gap-3 text-base leading-7',
              checked ? 'text-foreground' : 'text-fg-muted',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-3 shrink-0 items-center justify-center border transition-colors',
                checked ? 'border-hud' : 'border-fg-faint',
                'group-hover/radio:border-background group-focus-visible/radio:border-background',
              )}
            >
              <span
                className={cn(
                  'size-1.5 transition-colors',
                  checked
                    ? 'bg-hud group-hover/radio:bg-background group-focus-visible/radio:bg-background'
                    : 'bg-transparent',
                )}
              />
            </span>
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

/** The radio group of states, then Stop and Replay. */
export default function StateBar({
  label,
  stream,
}: {
  /** The demo name, for the radio group label. */
  label: string
  stream: LabStream
}) {
  const { machineState, isActive, run, scenario, stop, turn } = stream

  return (
    <div className="flex flex-col gap-5">
      <ScenarioRadioGroup
        label={`Force a state: ${label}`}
        value={scenario}
        onChange={run}
      />
      <div className="font-hud text-hud flex items-center gap-8 text-sm tracking-[0.42em]">
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
          <Square className="size-3 fill-current" aria-hidden="true" />
          Stop
        </button>
        <button
          type="button"
          className="hud-fill flex items-center gap-2 uppercase"
          onClick={() => run(scenario)}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Replay
        </button>
      </div>
      <p role="status" className="sr-only">
        {STATE_ANNOUNCEMENTS[machineState]}
        {turn && !isActive
          ? ` ${turn.sources.length} ${turn.sources.length === 1 ? 'source' : 'sources'} cited.`
          : ''}
      </p>
    </div>
  )
}
