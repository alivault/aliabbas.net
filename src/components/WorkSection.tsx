import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  FeaturedProject,
  ProjectVisualLink,
} from '~/components/home/ProjectCards'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import { recentWork } from '~/data/work'
import { DURATIONS, EASE_IN, SPRINGS } from '~/lib/design/motion'

/**
 * The work list. On wide screens the icon of the project in the middle of
 * the screen stays in a sticky stage on the left, and changes as the
 * projects scroll past. On small screens each project shows its own icon.
 */
export default function WorkSection({ header }: { header?: ReactNode }) {
  const [active, setActive] = useState(0)
  // One stable callback for each project, so that the effects in
  // FeaturedProject do not run again on each render.
  const activators = useMemo(
    () => recentWork.map((_, index) => () => setActive(index)),
    [],
  )
  const project = recentWork[active]

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
            data-work-stage={project.title}
            className="sticky top-[calc((40svh+var(--header-height))/2)] flex h-[60svh] flex-col items-center justify-center gap-8"
          >
            <div className="relative grid place-items-center">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: -40,
                    scale: 0.95,
                    transition: { duration: DURATIONS.exit, ease: EASE_IN },
                  }}
                  transition={SPRINGS.layout}
                >
                  {/* The text column has the same link. */}
                  <ProjectVisualLink project={project} size="large" hidden />
                </motion.div>
              </AnimatePresence>
            </div>
            <p
              aria-hidden="true"
              className="text-fg-muted text-sm leading-6 tabular-nums"
            >
              {active + 1} / {recentWork.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {recentWork.map((item, index) => (
            <FeaturedProject
              key={item.title}
              project={item}
              onActive={activators[index]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
