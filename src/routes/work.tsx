import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import {
  FeaturedProject,
  IndependentProject,
} from '~/components/home/ProjectCards'
import Main from '~/components/Main'
import { clientWork, personalProjects } from '~/data/work'

export const Route = createFileRoute('/work')({
  head: () => ({
    meta: [
      { title: 'Selected Work — Ali Abbas' },
      {
        name: 'description',
        content:
          'Selected client work and independent products designed and engineered by Ali Abbas.',
      },
    ],
  }),
  component: WorkPage,
})

function WorkPage() {
  return (
    <Main>
      <section className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
        <header className="grid gap-7 border-b border-black/20 pb-12 lg:grid-cols-[1fr_1fr] lg:items-end lg:pb-20">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-black/45 uppercase">
              Selected work / 2023—2026
            </p>
            <h1 className="font-display mt-5 text-[clamp(4rem,9vw,8rem)] leading-[0.78] tracking-[-0.06em]">
              Built for the
              <br />
              <em className="text-[#335cff]">real world.</em>
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-black/55 lg:justify-self-end lg:text-lg lg:leading-8">
            Product experiences where visual ambition and engineering rigor have
            to coexist. I care about the concept, the system, and the final 2px
            in production.
          </p>
        </header>

        <div>
          {clientWork.map((project, index) => (
            <FeaturedProject
              key={project.title}
              project={project}
              index={index}
            />
          ))}
        </div>

        <div className="mt-16 border-t border-black/20 pt-8 lg:mt-24 lg:pt-12">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-black/40 uppercase">
                Self-directed
              </p>
              <h2 className="font-display mt-2 text-5xl tracking-[-0.045em] sm:text-7xl">
                Independent builds
              </h2>
            </div>
            <a
              href="https://github.com/alivault"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 text-xs font-bold sm:flex"
            >
              More on GitHub <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="grid gap-10 lg:grid-cols-2">
            {personalProjects.map((project, index) => (
              <IndependentProject
                key={project.title}
                project={project}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    </Main>
  )
}
