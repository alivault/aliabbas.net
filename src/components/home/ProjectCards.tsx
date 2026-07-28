import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { clientWork } from '~/data/work'
import type { WorkItem } from '~/data/work'
import { cn } from '~/lib/utils'

const visualStyles = {
  blackhole: 'bg-[#7867ff] text-[#faff00]',
  superverse: 'bg-[#d8ff52] text-[#10100f]',
  impostors: 'bg-[#ff694a] text-[#10100f]',
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

function ProjectVisual({
  project,
  index,
  linked = true,
}: {
  project: WorkItem
  index: number
  linked?: boolean
}) {
  return (
    <div
      className={cn(
        'site-noise relative aspect-[4/3] overflow-hidden rounded-[2px]',
        visualStyles[project.visual],
      )}
    >
      <div className="project-lines absolute inset-0 opacity-40" />
      <span className="absolute top-5 left-5 z-10 font-mono text-[10px] font-medium tracking-[0.18em] uppercase opacity-55 sm:top-7 sm:left-7">
        Case study / 0{index + 1}
      </span>
      <span className="font-display absolute right-5 bottom-0 text-[clamp(7rem,20vw,17rem)] leading-[0.65] opacity-[0.08] sm:right-8">
        {index + 1}
      </span>

      {project.visual === 'blackhole' && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 size-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#faff00]/35"
          />
          <div className="absolute top-1/2 left-1/2 flex size-[44%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#10100f] shadow-[0_40px_100px_rgba(0,0,0,0.35)]">
            <img
              src={project.image}
              alt=""
              className="size-[68%] object-contain"
            />
          </div>
        </>
      )}

      {project.visual === 'superverse' && (
        <>
          <div className="absolute -right-[15%] -bottom-[38%] size-[90%] rounded-full border-[clamp(35px,7vw,90px)] border-[#10100f]" />
          <motion.img
            src={project.image}
            alt=""
            initial={{ rotate: -8, scale: 0.9 }}
            whileInView={{ rotate: 3, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/2 left-1/2 w-[42%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_30px_35px_rgba(0,0,0,0.22)]"
          />
        </>
      )}

      {project.visual === 'impostors' && (
        <>
          <div className="absolute top-[15%] right-[10%] size-20 rounded-full bg-[#20c9ed] sm:size-32" />
          <div className="absolute bottom-[12%] left-[8%] size-16 rounded-full bg-[#ffe66d] sm:size-24" />
          <motion.img
            src={project.image}
            alt=""
            initial={{ y: 35, rotate: -4 }}
            whileInView={{ y: 0, rotate: 2 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="absolute right-[12%] bottom-[3%] w-[70%] drop-shadow-[0_35px_35px_rgba(71,18,8,0.25)]"
          />
        </>
      )}

      {project.visual === 'pico' && (
        <>
          <div className="absolute inset-[12%] border border-black/20" />
          <div className="absolute top-[12%] bottom-[12%] left-1/2 w-px bg-black/20" />
          <motion.img
            src={project.image}
            alt=""
            whileHover={{ scale: 1.08, rotate: -4 }}
            className="absolute top-1/2 left-1/2 w-[29%] -translate-x-1/2 -translate-y-1/2 rounded-[18%] shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
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

      {linked ? (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="absolute right-5 bottom-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#10100f] text-white transition-transform hover:scale-105 hover:rotate-6 sm:right-7 sm:bottom-7 sm:size-14"
          aria-label={`Open ${project.title}`}
        >
          <ArrowUpRight className="size-5" />
        </a>
      ) : (
        <span
          aria-hidden="true"
          className="absolute right-5 bottom-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#10100f] text-white transition-transform group-hover:scale-105 group-hover:rotate-6 sm:right-7 sm:bottom-7 sm:size-14"
        >
          <ArrowUpRight className="size-5" />
        </span>
      )}
    </div>
  )
}

export function FeaturedProject({
  project,
  index,
}: {
  project: WorkItem
  index: number
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-7 border-t border-black/20 py-10 first:border-t-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:gap-12 lg:py-16"
    >
      <ProjectVisual project={project} index={index} />
      <div className="flex flex-col lg:py-3">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-black/45 uppercase">
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>
        <h3 className="font-display mt-7 text-[clamp(3.25rem,6vw,6rem)] leading-[0.82] tracking-[-0.05em]">
          {project.title}
        </h3>
        <p className="mt-7 max-w-md text-base leading-7 text-black/60">
          {project.description}
        </p>
        <div className="mt-7 border-l border-black/25 pl-4">
          <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
            Contribution
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-black/55">
            {project.contribution}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {project.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-black/20 px-3 py-1.5 text-[10px] font-semibold"
            >
              {tool}
            </span>
          ))}
        </div>
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="group mt-auto flex items-center justify-between border-b border-black/25 pt-10 pb-3 text-xs font-bold uppercase"
        >
          Visit live project
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </a>
      </div>
    </motion.article>
  )
}

export function IndependentProject({
  project,
  index,
}: {
  project: WorkItem
  index: number
}) {
  return (
    <motion.a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group block rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
    >
      <ProjectVisual
        project={project}
        index={index + clientWork.length}
        linked={false}
      />
      <div className="py-5">
        <div>
          <p className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
            {project.category}
          </p>
          <h3 className="font-display mt-2 text-4xl tracking-[-0.04em] sm:text-5xl">
            {project.title}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
            {project.description}
          </p>
        </div>
      </div>
    </motion.a>
  )
}
