import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Hand } from 'lucide-react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
} from 'motion/react'
import type { PanInfo } from 'motion/react'
import { SPRINGS } from '~/lib/design/motion'
import { cn } from 'cn'
import Frame from './Frame'

const CORNERS = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const
type Corner = (typeof CORNERS)[number]

const CORNER_NAMES: Record<Corner, string> = {
  'top-left': 'top left',
  'top-right': 'top right',
  'bottom-left': 'bottom left',
  'bottom-right': 'bottom right',
}

/** Where each corner target sits in the stage. */
const CORNER_CLASSES: Record<Corner, string> = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
}

/** The corner that an arrow key moves the card to, from each corner. */
const ARROW_MOVES: Record<string, (corner: Corner) => Corner> = {
  ArrowLeft: (corner) => corner.replace('right', 'left') as Corner,
  ArrowRight: (corner) => corner.replace('left', 'right') as Corner,
  ArrowUp: (corner) => corner.replace('bottom', 'top') as Corner,
  ArrowDown: (corner) => corner.replace('top', 'bottom') as Corner,
}

/** The gap between the card and the stage edge, in px (Tailwind 3). */
const INSET = 12

/**
 * How far the momentum of a throw carries the card, in seconds of its
 * release velocity. The card lands in the corner nearest to that point,
 * so a flick decides the corner, not only the place of release.
 */
const MOMENTUM = 0.2

/**
 * A card to drag and throw, as a picture-in-picture window. On release it
 * lands in the corner its momentum points to, on a spring that starts at
 * the release velocity. It tilts with its speed. Arrow keys move it from
 * corner to corner. With reduced motion, it jumps.
 */
export default function ThrowExample() {
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(useVelocity(x), [-2500, 2500], [-12, 12], {
    clamp: true,
  })
  const [corner, setCorner] = useState<Corner>('top-left')
  const cornerRef = useRef<Corner>(corner)
  /** While a drag runs: the corner that the card will land in. */
  const [landing, setLanding] = useState<Corner | null>(null)

  /** The card offset for each corner, from the top-left corner. */
  const offsets = (): Record<Corner, [number, number]> | null => {
    const stage = stageRef.current
    const card = cardRef.current
    if (!stage || !card) return null
    const right = stage.clientWidth - card.offsetWidth - INSET * 2
    const bottom = stage.clientHeight - card.offsetHeight - INSET * 2
    return {
      'top-left': [0, 0],
      'top-right': [right, 0],
      'bottom-left': [0, bottom],
      'bottom-right': [right, bottom],
    }
  }

  const nearest = (pointX: number, pointY: number): Corner => {
    const points = offsets()
    if (!points) return cornerRef.current
    return CORNERS.reduce((best, next) =>
      Math.hypot(points[next][0] - pointX, points[next][1] - pointY) <
      Math.hypot(points[best][0] - pointX, points[best][1] - pointY)
        ? next
        : best,
    )
  }

  const landingOf = (info: PanInfo) =>
    nearest(
      x.get() + info.velocity.x * MOMENTUM,
      y.get() + info.velocity.y * MOMENTUM,
    )

  const moveTo = (next: Corner, velocity = { x: 0, y: 0 }) => {
    const points = offsets()
    if (!points) return
    cornerRef.current = next
    setCorner(next)
    const [toX, toY] = points[next]
    if (reduceMotion) {
      x.jump(toX)
      y.jump(toY)
      return
    }
    animate(x, toX, { ...SPRINGS.hover, velocity: velocity.x })
    animate(y, toY, { ...SPRINGS.hover, velocity: velocity.y })
  }

  // Keep the card in its corner when the stage changes size.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new ResizeObserver(() => {
      const points = offsets()
      if (!points) return
      const [toX, toY] = points[cornerRef.current]
      x.jump(toX)
      y.jump(toY)
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [x, y])

  const onKeyDown = (event: KeyboardEvent) => {
    const move = ARROW_MOVES[event.key]
    if (!move) return
    event.preventDefault()
    moveTo(move(cornerRef.current))
  }

  return (
    <Frame caption="Throw the card: it lands where its momentum points. Arrow keys move it.">
      <div
        ref={stageRef}
        className="bg-muted/50 relative min-h-56 flex-1 rounded-lg"
      >
        {CORNERS.map((name) => (
          <div
            key={name}
            aria-hidden="true"
            className={cn(
              'absolute h-20 w-32 rounded-xl border border-dashed transition-colors',
              CORNER_CLASSES[name],
              landing === name
                ? 'border-brand bg-brand/10'
                : 'border-foreground/15',
            )}
          />
        ))}
        <motion.button
          ref={cardRef}
          type="button"
          aria-label={`Card, in the ${CORNER_NAMES[corner]} corner`}
          aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
          drag
          dragConstraints={stageRef}
          dragElastic={0.2}
          dragMomentum={false}
          onDrag={(_, info) => {
            const next = landingOf(info)
            if (next !== landing) setLanding(next)
          }}
          onDragEnd={(_, info) => {
            setLanding(null)
            moveTo(landingOf(info), info.velocity)
          }}
          onKeyDown={onKeyDown}
          whileDrag={reduceMotion ? undefined : { scale: 1.05 }}
          style={{ x, y, rotate: reduceMotion ? 0 : rotate }}
          className="bg-foreground text-background focus-visible:ring-ring/50 absolute top-3 left-3 flex h-20 w-32 cursor-grab touch-none flex-col justify-between rounded-xl p-3 text-left shadow-lg outline-none select-none focus-visible:ring-3 active:cursor-grabbing"
        >
          <Hand aria-hidden="true" className="size-4" />
          <span className="text-sm font-semibold">Throw me</span>
        </motion.button>
        <p role="status" className="sr-only">
          Card in the {CORNER_NAMES[corner]} corner.
        </p>
      </div>
    </Frame>
  )
}
