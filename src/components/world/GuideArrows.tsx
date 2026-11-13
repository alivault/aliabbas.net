import { useEffect, useRef } from 'react'
import { ChevronUp } from 'lucide-react'
import { onGuide } from './guide'
import { worldCommands } from './store'

const SLOTS = 3

/**
 * Arrows on an oval near the edge of the screen, toward the nearest icons
 * when none is in sight: at the top for an icon ahead, at the side for one
 * to the side, at the bottom for one behind. A click flies there. They
 * repeat Next and the index, so screen readers and the Tab key skip them.
 */
export default function GuideArrows() {
  const slots = useRef<Array<HTMLButtonElement | null>>([])
  const ids = useRef<Array<string>>([])

  useEffect(
    () =>
      onGuide((arrows) => {
        const width = window.innerWidth
        const height = window.innerHeight
        const rx = width / 2 - 44
        // Clear of the corners, and above the line at the bottom center.
        const ry = height / 2 - 140
        slots.current.forEach((slot, index) => {
          if (!slot) return
          const arrow = arrows[index]
          if (!arrow) {
            slot.style.opacity = '0'
            slot.style.pointerEvents = 'none'
            return
          }
          ids.current[index] = arrow.id
          const x = width / 2 + Math.sin(arrow.angle) * rx
          const y = height / 2 - Math.cos(arrow.angle) * ry
          slot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${arrow.angle}rad)`
          slot.style.opacity = String(arrow.strength)
          slot.style.pointerEvents = 'auto'
          slot.title = arrow.title
        })
      }),
    [],
  )

  return (
    <div aria-hidden="true">
      {Array.from({ length: SLOTS }, (_, index) => (
        <button
          key={index}
          ref={(element) => {
            slots.current[index] = element
          }}
          type="button"
          tabIndex={-1}
          data-sound="hover"
          onClick={() => {
            const id = ids.current[index]
            if (id) worldCommands.goTo(id)
          }}
          className="text-hud hover:text-foreground absolute top-0 left-0 p-2 opacity-0 transition-[opacity,color] duration-300"
        >
          <ChevronUp className="size-9" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}
