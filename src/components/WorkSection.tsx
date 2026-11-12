import { createRef, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import {
  FeaturedProject,
  ProjectBlockLink,
} from '~/components/home/ProjectCards'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import { recentWork } from '~/data/work'
import type { WorkItem } from '~/data/work'

/** The turn of the cube from one face to the next, in degrees. */
const FACE_TURN = 90

/** How dark a face gets as it turns a full face away from the screen. */
const FACE_SHADE = 0.6

/**
 * The scroll progress of one row, from 0 to 1. The first row moves as the
 * list comes into view. Each next row moves while the row above it leaves
 * the middle. It is at 1 when the top of its row is at 30% of the screen, a
 * little before the row is in the middle (at about 23%: 20% plus half the
 * header). Renders nothing.
 */
function RowProgress({
  rowRef,
  first,
  onChange,
}: {
  rowRef: RefObject<HTMLDivElement | null>
  first: boolean
  onChange: (progress: number) => void
}) {
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: first ? ['start end', 'start center'] : ['start 0.6', 'start 0.3'],
  })
  useMotionValueEvent(scrollYProgress, 'change', onChange)
  // The page can load scrolled down.
  useEffect(() => onChange(scrollYProgress.get()), [scrollYProgress, onChange])
  return null
}

/**
 * One face of the cube. Face `index` faces the screen when the cube has
 * turned `index` faces. It gets darker as it turns away.
 */
function CubeFace({
  project,
  index,
  turn,
  still,
}: {
  project: WorkItem
  index: number
  turn: MotionValue<number>
  /** Reduced motion: the cube does not turn, so no face is shaded. */
  still: boolean
}) {
  const shade = useTransform(
    turn,
    (value) => Math.min(1, Math.abs(value - index)) * FACE_SHADE,
  )
  return (
    <div
      className="absolute inset-0 backface-hidden"
      style={{
        transform: `rotateX(${-index * FACE_TURN}deg) translateZ(50cqh)`,
      }}
    >
      {/* The text column has the same link. */}
      <ProjectBlockLink project={project} hidden />
      <motion.div
        aria-hidden="true"
        style={{ opacity: still ? 0 : shade }}
        className="pointer-events-none absolute inset-0 bg-black"
      />
    </div>
  )
}

/**
 * The work list. On wide screens the blocks of the projects are the faces
 * of a cube in a sticky stage on the left. The cube turns with the scroll,
 * in both directions: as each project scrolls into the middle, its face
 * rolls up from below. On small screens each project shows its own block.
 */
export default function WorkSection({ header }: { header?: ReactNode }) {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  const progress = useRef(recentWork.map(() => 0))
  /** The faces the cube has turned, from 0 to the last project. */
  const turn = useMotionValue(0)
  /** The entrance of the cube as the list comes into view, from 0 to 1. */
  const entrance = useMotionValue(0)
  const rows = useMemo(
    () =>
      recentWork.map((_, index) => ({
        ref: createRef<HTMLDivElement>(),
        // One stable callback for each project, so that the effects in
        // FeaturedProject do not run again on each render.
        activate: () => setActive(index),
        track: (value: number) => {
          progress.current[index] = value
          if (index === 0) entrance.set(value)
          else turn.set(progress.current.slice(1).reduce((a, b) => a + b, 0))
        },
      })),
    [entrance, turn],
  )
  const rotateX = useTransform(turn, (value) => value * FACE_TURN)
  const scale = useTransform(entrance, [0, 1], [0.92, 1])

  return (
    <section
      id="work"
      className="py-section mx-auto max-w-[1600px] scroll-mt-[calc(var(--header-height)-1px)] px-5 sm:px-8 lg:px-12"
    >
      {header ?? (
        <ScrollReveal as="header" className="pb-section-content">
          <SectionHeading>Recent work</SectionHeading>
        </ScrollReveal>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-12">
        <div className="hidden lg:block">
          <div
            data-work-stage={recentWork[active].title}
            className="sticky top-[calc((40svh+var(--header-height))/2)] flex h-[60svh] flex-col"
          >
            {recentWork.map((project, index) => (
              <RowProgress
                key={project.title}
                rowRef={rows[index].ref}
                first={index === 0}
                onChange={rows[index].track}
              />
            ))}
            {/* @container-size: the faces measure the cube depth in cqh. */}
            <motion.div
              style={{ opacity: entrance, scale: reduceMotion ? 1 : scale }}
              className="@container-size relative flex-1 perspective-[2400px]"
            >
              <motion.div
                // With reduced motion, the cube shows the project in the
                // middle at once, with no turn.
                style={{
                  rotateX: reduceMotion ? active * FACE_TURN : rotateX,
                  z: '-50cqh',
                }}
                className="absolute inset-0 transform-3d"
              >
                {recentWork.map((project, index) => (
                  <CubeFace
                    key={project.title}
                    project={project}
                    index={index}
                    turn={turn}
                    still={reduceMotion ?? false}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col">
          {recentWork.map((project, index) => (
            <FeaturedProject
              key={project.title}
              project={project}
              rowRef={rows[index].ref}
              onActive={rows[index].activate}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
