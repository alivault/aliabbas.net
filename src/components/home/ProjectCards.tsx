import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import MonoLabel from '~/components/MonoLabel'
import Title from '~/components/Title'
import type { WorkItem } from '~/data/work'
import { cn } from 'cn'

const visualStyles = {
  whimcall: 'bg-[#080b12] text-white',
  pico: 'bg-[#d8d5cd] text-[#10100f]',
  chromagine: 'bg-[#335cff] text-white',
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

function ProjectVisual({ project }: { project: WorkItem }) {
  return (
    <div
      className={cn(
        'site-noise relative aspect-[4/3] overflow-hidden rounded-[2px]',
        visualStyles[project.visual],
      )}
    >
      <div className="project-lines absolute inset-0 opacity-40" />
      {project.visual === 'pico' && (
        <>
          <div className="absolute inset-[12%] border border-black/20" />
          <div className="absolute top-[12%] bottom-[12%] left-1/2 w-px bg-black/20" />
          <img
            src={project.image}
            alt=""
            className="absolute top-1/2 left-1/2 w-[29%] -translate-x-1/2 -translate-y-1/2 rounded-[18%] shadow-[0_30px_60px_rgba(0,0,0,0.25)] transition-transform duration-500 group-hover:scale-[1.08] group-hover:-rotate-3"
          />
        </>
      )}

      {project.visual === 'whimcall' && (
        <>
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-[38%] size-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff2f75]/45 blur-[55px]"
          />
          <motion.div
            animate={{ scale: [1.1, 0.96, 1.1], opacity: [0.5, 0.75, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-[62%] size-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006dff]/55 blur-[55px]"
          />
          <div className="absolute top-1/2 left-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 size-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <motion.img
            src={project.image}
            alt=""
            initial={{ scale: 0.88, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/2 left-1/2 z-10 w-[34%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_24px_40px_rgba(50,60,255,0.38)] transition-transform duration-500 group-hover:scale-[1.06]"
          />
        </>
      )}

      {project.visual === 'chromagine' && (
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2"
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
                  type: 'spring',
                  stiffness: 220,
                  damping: 18,
                }}
                className="pointer-events-none absolute inset-0"
              >
                <motion.span
                  whileHover={{ scale: 1.14, y: -10, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 18,
                  }}
                  className="pointer-events-auto absolute top-[2%] left-1/2 h-[43%] w-[29%] origin-bottom -translate-x-1/2 cursor-pointer rounded-[999px] border border-white/35 opacity-90 mix-blend-screen shadow-[0_12px_30px_rgba(16,16,15,0.14)] backdrop-blur-[2px]"
                  style={{ backgroundColor: color }}
                />
              </motion.span>
            </span>
          ))}
        </div>
      )}

      <span
        aria-hidden="true"
        className="absolute right-5 bottom-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#10100f] text-white transition-transform group-hover:scale-105 group-hover:rotate-6 sm:right-7 sm:bottom-7 sm:size-14"
      >
        <ArrowUpRight className="size-5" />
      </span>
    </div>
  )
}

export function FeaturedProject({ project }: { project: WorkItem }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-7"
    >
      <a
        href={project.href}
        target="_blank"
        rel="noreferrer"
        className="group focus-visible:outline-foreground block rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-4"
        aria-label={`Open ${project.title}`}
      >
        <ProjectVisual project={project} />
      </a>
      <div className="flex flex-1 flex-col">
        <Title as="h3" variant="card">
          {project.title}
        </Title>
        <p className="text-foreground/60 mt-7 max-w-md text-base leading-7">
          {project.description}
        </p>
        <div className="border-foreground/25 mt-7 border-l pl-4">
          <MonoLabel>Contribution</MonoLabel>
          <p className="text-foreground/55 mt-2 max-w-sm text-sm leading-6">
            {project.contribution}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {project.tools.map((tool) => (
            <span
              key={tool}
              className="border-foreground/20 rounded-full border px-3 py-1.5 text-[10px] font-semibold"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  )
}
