import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import Meta, { metaStyles } from '~/components/Meta'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import type { WorkItem } from '~/data/work'
import { cn } from 'cn'
import { SPRINGS } from '~/lib/design/motion'

/** Background of each app icon. */
const iconStyles = {
  whimcall: 'bg-[#080b12]',
  pico: 'bg-black',
  chromagine: 'bg-[#335cff]',
} satisfies Record<WorkItem['visual'], string>

const chromaginePetals = [
  '#ff375f',
  '#ff9f0a',
  '#ffd60a',
  '#30d158',
  '#64d2ff',
  '#0a84ff',
  '#bf5af2',
  '#ff2d95',
] as const

const visualLinkStyles =
  'group focus-visible:outline-foreground block rounded-[22.5%] focus-visible:outline-2 focus-visible:outline-offset-4'

const cardLinkStyles = cn(
  metaStyles('brand'),
  'hover:text-foreground focus-visible:outline-foreground inline-flex min-h-6 font-medium items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4',
)

/** The project as an app icon: a rounded square with its mark inside. */
function ProjectVisual({ project }: { project: WorkItem }) {
  return (
    <div
      className={cn(
        'site-noise ring-foreground/10 relative isolate size-28 overflow-hidden rounded-[22.5%] shadow-2xl ring-1 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.03] sm:size-40 lg:size-64',
        iconStyles[project.visual],
      )}
    >
      {project.visual === 'pico' && (
        <img
          src={project.image}
          alt=""
          className="absolute inset-[14%] size-[72%]"
        />
      )}

      {project.visual === 'whimcall' && (
        <>
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-[38%] size-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff2f75]/45 blur-xl lg:blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 0.96, 1.1], opacity: [0.5, 0.75, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-[62%] size-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006dff]/55 blur-xl lg:blur-3xl"
          />
          <img
            src={project.image}
            alt=""
            className="absolute top-1/2 left-1/2 z-10 size-[62%] -translate-x-1/2 -translate-y-1/2"
          />
        </>
      )}

      {project.visual === 'chromagine' && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-[74%] -translate-x-1/2 -translate-y-1/2"
        >
          {chromaginePetals.map((color, petalIndex) => (
            <span
              key={color}
              className="pointer-events-none absolute inset-0"
              style={{ transform: `rotate(${petalIndex * 45}deg)` }}
            >
              <motion.span
                initial={{ scale: 0.65, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: petalIndex * 0.05,
                  ...SPRINGS.bloom,
                }}
                className="pointer-events-none absolute inset-0"
              >
                <motion.span
                  whileHover={{ scale: 1.14, y: -6, opacity: 1 }}
                  transition={SPRINGS.hover}
                  className="pointer-events-auto absolute top-[2%] left-1/2 h-[43%] w-[29%] origin-bottom -translate-x-1/2 cursor-pointer rounded-[999px] border border-white/35 opacity-90 mix-blend-screen"
                  style={{ backgroundColor: color }}
                />
              </motion.span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** One work item on its own row: the visual on one side, the details on the other. */
export function FeaturedProject({ project }: { project: WorkItem }) {
  return (
    <ScrollReveal
      as="article"
      className="border-foreground/15 grid gap-8 border-t py-10 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-16"
    >
      <div className="flex lg:justify-center">
        {project.caseStudy ? (
          <Link
            to="/work/$slug"
            params={{ slug: project.caseStudy }}
            className={visualLinkStyles}
            aria-label={`Read the ${project.title} case study`}
          >
            <ProjectVisual project={project} />
          </Link>
        ) : (
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className={visualLinkStyles}
            aria-label={`Open ${project.title}`}
          >
            <ProjectVisual project={project} />
          </a>
        )}
      </div>
      <div className="flex max-w-xl flex-col">
        <div className="flex items-baseline justify-between gap-4">
          <Title as="h3" variant="card">
            {project.title}
          </Title>
          <Meta as="span">{project.year}</Meta>
        </div>
        <Meta className="mt-1">{project.category}</Meta>
        <p className="text-fg-secondary mt-5 text-base leading-7 text-pretty lg:text-lg lg:leading-8">
          {project.description}
        </p>
        <dl className="border-foreground/15 mt-6 grid gap-x-6 gap-y-3 border-t pt-6 text-sm leading-6 sm:grid-cols-[auto_1fr]">
          <dt className="text-foreground font-medium">Contribution</dt>
          <dd className="text-fg-muted">{project.contribution}</dd>
          <dt className="text-foreground font-medium">Stack</dt>
          <dd className="text-fg-muted">{project.tools.join(', ')}</dd>
        </dl>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
          {project.caseStudy && (
            <Link
              to="/work/$slug"
              params={{ slug: project.caseStudy }}
              className={cardLinkStyles}
            >
              Case study
              <ArrowRight className="size-4" aria-hidden="true" />
              <span className="sr-only">: {project.title}</span>
            </Link>
          )}
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className={cardLinkStyles}
          >
            Visit site
            <ArrowUpRight className="size-4" aria-hidden="true" />
            <span className="sr-only">
              : {project.title} (opens in a new tab)
            </span>
          </a>
        </div>
      </div>
    </ScrollReveal>
  )
}
