import { createRef, useMemo, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { useScroll } from 'motion/react'
import {
  FeaturedProject,
  ProjectBlockLink,
} from '~/components/home/ProjectCards'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import { recentWork } from '~/data/work'
import type { WorkItem } from '~/data/work'

/**
 * One block in the stage. It opens from its center while its row scrolls
 * up the screen, so the blocks follow the scroll position, in both
 * directions. The first block opens as the list comes into view. Each next
 * block waits while the row above it moves from the middle of the screen
 * up by 30% of the screen height, then opens until its own row is in the
 * middle.
 */
function StageBlock({
  project,
  rowRef,
  first,
}: {
  project: WorkItem
  rowRef: RefObject<HTMLDivElement | null>
  first: boolean
}) {
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: first ? ['start end', 'start center'] : ['start 0.5', 'start 0.2'],
  })
  return (
    // The text column has the same link.
    <ProjectBlockLink project={project} reveal={scrollYProgress} hidden />
  )
}

/**
 * The work list. On wide screens the blocks of the projects are in a sticky
 * stage on the left: as each project scrolls into the middle, its block
 * wipes in on top of the one before. On small screens each
 * project shows its own block.
 */
export default function WorkSection({ header }: { header?: ReactNode }) {
  const [active, setActive] = useState(0)
  const rows = useMemo(
    () =>
      recentWork.map((_, index) => ({
        ref: createRef<HTMLDivElement>(),
        // One stable callback for each project, so that the effects in
        // FeaturedProject do not run again on each render.
        activate: () => setActive(index),
      })),
    [],
  )

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
            className="sticky top-[calc((40svh+var(--header-height))/2)] flex h-[60svh] flex-col gap-4"
          >
            <div className="relative flex-1">
              {recentWork.map((project, index) => (
                <StageBlock
                  key={project.title}
                  project={project}
                  rowRef={rows[index].ref}
                  first={index === 0}
                />
              ))}
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
