import { ArrowUpRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import { clientWork, personalProjects } from '~/data/work'
import { FeaturedProject, IndependentProject } from './ProjectCards'

export default function HomeWorkSection() {
  return (
    <section
      id="work"
      className="mx-auto max-w-[1600px] scroll-mt-[71px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36"
    >
      <ScrollReveal as="header" className="pb-12 lg:pb-20">
        <h2 className="font-display text-5xl tracking-[-0.045em] sm:text-7xl">
          Recent work
        </h2>
      </ScrollReveal>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {clientWork.map((project) => (
          <FeaturedProject key={project.title} project={project} />
        ))}
      </div>

      <div className="mt-16 pt-8 lg:mt-24 lg:pt-12">
        <ScrollReveal className="mb-10 flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-5xl tracking-[-0.045em] sm:text-7xl">
              Side projects
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
        </ScrollReveal>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
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
  )
}
