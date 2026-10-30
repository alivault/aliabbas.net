import { useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Gamepad2, Keyboard, Smartphone } from 'lucide-react'

type Binding = [Array<string>, string]

const SCHEMES: Array<{
  name: string
  icon: LucideIcon
  bindings: Array<Binding>
}> = [
  {
    name: 'Keyboard and mouse',
    icon: Keyboard,
    bindings: [
      [['W', 'A', 'S', 'D'], 'Thrust and strafe'],
      [['Mouse'], 'Pitch and turn'],
      [['Q', 'E'], 'Roll'],
      [['Space', 'C'], 'Slide up / down'],
      [['Left click'], 'Fire primary'],
      [['Right click'], 'Fire missile'],
      [['Shift'], 'Afterburner'],
      [['1', '2', '3'], 'Primary weapon'],
      [['4', '5'], 'Missile type'],
      [['F'], 'Drop a flare'],
      [['H'], 'Headlight'],
      [['M'], 'Map'],
    ],
  },
  {
    name: 'Gamepad',
    icon: Gamepad2,
    bindings: [
      [['Left stick'], 'Thrust and strafe'],
      [['Right stick'], 'Pitch and turn'],
      [['LB', 'RB'], 'Roll'],
      [['A', 'B'], 'Slide up / down'],
      [['RT'], 'Fire primary'],
      [['LT'], 'Fire missile'],
      [['L3'], 'Afterburner'],
      [['X', 'Y'], 'Cycle weapons'],
      [['Back'], 'Map'],
    ],
  },
  {
    name: 'Touch',
    icon: Smartphone,
    bindings: [
      [['Left stick'], 'Thrust and strafe'],
      [['Drag right side'], 'Pitch and turn'],
      [['▲', '▼'], 'Slide up / down'],
      [['Fire'], 'Hold to fire'],
      [['Rocket'], 'Fire missile'],
      [['Flame'], 'Afterburner'],
    ],
  },
]

export default function ControlsTabs() {
  const [active, setActive] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const id = useId()

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (active + step + SCHEMES.length) % SCHEMES.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Input device"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-2"
      >
        {SCHEMES.map((scheme, index) => {
          const Icon = scheme.icon
          const selected = index === active
          return (
            <button
              key={scheme.name}
              ref={(element) => {
                tabs.current[index] = element
              }}
              id={`${id}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={`st-display inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold uppercase transition-colors ${
                selected
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {scheme.name}
            </button>
          )
        })}
      </div>
      {SCHEMES.map((scheme, index) => (
        <div
          key={scheme.name}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== active}
          className="mt-4 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {scheme.bindings.map(([keys, action]) => (
            <div
              key={action}
              className="bg-foreground/[0.04] flex min-h-12 items-center justify-between gap-3 px-4 py-2"
            >
              <span className="text-foreground/70 text-sm">{action}</span>
              <span className="flex flex-wrap justify-end gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="st-display border-foreground/20 bg-background text-foreground inline-flex h-7 min-w-7 items-center justify-center border border-b-2 px-2 text-xs font-semibold uppercase"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
