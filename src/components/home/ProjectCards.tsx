import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import Meta from '~/components/Meta'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { ButtonAnchor, ButtonLink } from '~/components/ui/button'
import type { WorkItem } from '~/data/work'
import { cn } from 'cn'

/** Background of each project block. */
const blockStyles = {
  whimcall: 'bg-[#080b12]',
  pico: 'bg-black',
  postmaster: 'bg-[#101114]',
} satisfies Record<WorkItem['visual'], string>

// @container-size: the wipe of ProjectBlock measures its angle in cqh.
const blockLinkStyles =
  'focus-visible:outline-foreground @container-size block focus-visible:outline-2 focus-visible:outline-offset-4'

/**
 * The horizontal run of the wipe edge over the full block height, for an
 * edge at 60 degrees to the horizontal: 100cqh / tan(60deg). It is in cqh,
 * not %, so the angle stays at 60 degrees for every block shape.
 */
const WIPE_RUN = '57.735cqh'

/**
 * A clip path that shows the part of the block right of a 60 degree edge,
 * so the block opens from right to left. At 0 the edge is just right of the
 * block, at 1 just left of it.
 */
function wipe(progress: number) {
  const travel = `${progress} * (100% + ${WIPE_RUN})`
  const top = `calc(100% + ${WIPE_RUN} - ${travel})`
  const bottom = `calc(100% - ${travel})`
  return `polygon(${top} 0, 100% 0, 100% 100%, ${bottom} 100%)`
}

/** The mark of a project. Its sizes are a part of the block height. */
function ProjectMark({ project }: { project: WorkItem }) {
  // Only the P of /pico.svg: the file has a rounded square around it.
  if (project.visual === 'pico')
    return (
      <svg
        viewBox="0 0 102 136"
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 h-[30%] w-auto -translate-x-1/2 -translate-y-1/2 fill-white"
      >
        <path d="M0 34h34v102H0zM34 0h68v34H34zM34 68h34v34H34zM68 34h34v34H68z" />
      </svg>
    )

  if (project.visual === 'whimcall')
    return (
      <>
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-[42%] aspect-square h-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff2f75]/45 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 0.96, 1.1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-[58%] aspect-square h-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006dff]/55 blur-3xl"
        />
        <img
          src={project.image}
          alt=""
          className="absolute top-1/2 left-1/2 z-10 aspect-square h-[42%] w-auto -translate-x-1/2 -translate-y-1/2"
        />
      </>
    )

  // Postmaster: the app icon over a slow glow in the colors of the sunset
  // photo on its letter.
  return (
    <>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[46%] left-1/2 aspect-[3/2] h-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7a45]/40 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.08, 0.95, 1.08], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[58%] left-1/2 aspect-[3/2] h-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b5cff]/35 blur-3xl"
      />
      <img
        src={project.image}
        alt=""
        className="absolute top-1/2 left-1/2 z-10 aspect-square h-[52%] w-auto -translate-x-1/2 -translate-y-1/2"
      />
    </>
  )
}

/**
 * The project as a block with sharp corners. It fills its parent, which sets
 * the size. `reveal` is a scroll progress from 0 to 1: a wipe with a
 * 60 degree edge opens the block from right to left, and the mark settles
 * from a larger size.
 */
function ProjectBlock({
  project,
  reveal,
}: {
  project: WorkItem
  reveal: MotionValue<number>
}) {
  const reduceMotion = useReducedMotion()
  const clipPath = useTransform(reveal, wipe)
  const scale = useTransform(reveal, [0, 1], [reduceMotion ? 1 : 1.25, 1])
  return (
    <motion.div
      style={{ clipPath }}
      className={cn(
        'ring-foreground/10 pointer-events-auto absolute inset-0 overflow-hidden ring-1 ring-inset',
        blockStyles[project.visual],
      )}
    >
      {/* site-noise sets position: relative, so it is not on the
          absolute layers. */}
      <div className="site-noise size-full">
        <motion.div style={{ scale }} className="absolute inset-0">
          <ProjectMark project={project} />
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * The project block as a link: to the case study if there is one, else to
 * the live site. It fills its parent. `hidden` takes it out of the tab
 * order and the accessibility tree, for a copy of a link that is already on
 * the page.
 */
export function ProjectBlockLink({
  project,
  reveal,
  hidden = false,
}: {
  project: WorkItem
  reveal: MotionValue<number>
  hidden?: boolean
}) {
  const a11y = hidden
    ? ({ tabIndex: -1, 'aria-hidden': true } as const)
    : undefined
  const className = cn(
    blockLinkStyles,
    // Only the clipped block takes the pointer: the link fills the stage,
    // also where its block is still closed.
    'pointer-events-none absolute inset-0',
  )
  const block = <ProjectBlock project={project} reveal={reveal} />
  if (project.caseStudy)
    return (
      <Link
        to="/work/$slug"
        params={{ slug: project.caseStudy }}
        className={className}
        aria-label={`Read the ${project.title} case study`}
        {...a11y}
      >
        {block}
      </Link>
    )
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      className={className}
      aria-label={`Open ${project.title}`}
      {...a11y}
    >
      {block}
    </a>
  )
}

/**
 * The block of a project on small screens, above its text. It opens from
 * its center as its top scrolls from the bottom to the middle of the screen.
 */
function InlineBlock({ project }: { project: WorkItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start center'],
  })
  return (
    <div ref={ref} className="relative aspect-[4/3] w-full lg:hidden">
      <ProjectBlockLink project={project} reveal={scrollYProgress} />
    </div>
  )
}

/**
 * One work item on its own row. On wide screens its block is in the sticky
 * stage of WorkSection, which follows `rowRef` as it scrolls. `onActive`
 * runs when the row reaches the middle of the screen.
 */
export function FeaturedProject({
  project,
  rowRef,
  onActive,
}: {
  project: WorkItem
  rowRef?: RefObject<HTMLDivElement | null>
  onActive?: () => void
}) {
  const ownRef = useRef<HTMLDivElement>(null)
  const ref = rowRef ?? ownRef
  const inMiddle = useInView(ref, { margin: '-50% 0px -50% 0px' })
  useEffect(() => {
    if (inMiddle) onActive?.()
  }, [inMiddle, onActive])

  return (
    <ScrollReveal
      as="article"
      className="border-foreground/15 border-t py-10 first:border-t-0 first:pt-0 last:pb-0 lg:border-t-0 lg:py-0"
    >
      <div
        ref={ref}
        data-work-item={project.title}
        className="flex flex-col items-start gap-6 lg:min-h-[60svh] lg:justify-center"
      >
        <InlineBlock project={project} />
        <div className="flex w-full max-w-2xl flex-col">
          <Title as="h3" variant="card">
            {project.title}
          </Title>
          <Meta className="mt-1">
            {project.category} · {project.year}
          </Meta>
          <p className="text-fg-secondary mt-4 text-base leading-7 text-pretty lg:text-lg lg:leading-8">
            {project.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {project.caseStudy && (
              <ButtonLink to="/work/$slug" params={{ slug: project.caseStudy }}>
                Case study
                <ArrowRight aria-hidden="true" />
                <span className="sr-only">: {project.title}</span>
              </ButtonLink>
            )}
            <ButtonAnchor
              href={project.href}
              // The first action is the primary one: the case study if there
              // is one, else the site.
              variant={project.caseStudy ? 'secondary' : 'primary'}
            >
              Visit site
              <ArrowUpRight aria-hidden="true" />
              <span className="sr-only">
                : {project.title} (opens in a new tab)
              </span>
            </ButtonAnchor>
          </div>
        </div>
      </div>
    </ScrollReveal>
  )
}
