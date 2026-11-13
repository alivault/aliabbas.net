import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { cn } from 'cn'
import { SPECIMENS, tabId } from './specimens'
import type { SpecimenId } from './specimens'

/**
 * The tabs of the lab: one demo shows at a time. Arrow keys, Home and End
 * move and select, as in a native tab list, and Tab goes into the demo.
 */
export default function LabTabs({
  value,
  onChange,
}: {
  value: SpecimenId
  onChange: (id: SpecimenId) => void
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const move = (event: KeyboardEvent, index: number) => {
    const last = SPECIMENS.length - 1
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
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
    onChange(SPECIMENS[next].id)
  }

  return (
    <div
      role="tablist"
      aria-label="Demos"
      className="font-hud -mx-6 flex gap-x-10 overflow-x-auto px-6 py-2 text-xs tracking-[0.36em] whitespace-nowrap sm:mx-0 sm:px-1"
    >
      {SPECIMENS.map((specimen, index) => {
        const selected = specimen.id === value
        return (
          <button
            key={specimen.id}
            ref={(element) => {
              refs.current[index] = element
            }}
            id={tabId(specimen.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={specimen.id}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(specimen.id)}
            onKeyDown={(event) => move(event, index)}
            data-sound="click"
            className={cn(
              'hud-fill uppercase underline-offset-[10px]',
              selected ? 'text-hud underline' : 'text-hud/55',
            )}
          >
            {specimen.label}
          </button>
        )
      })}
    </div>
  )
}
