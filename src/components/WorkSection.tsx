import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import {
  FeaturedProject,
  IndependentProject,
} from '~/components/home/ProjectCards'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import { clientWork, personalProjects } from '~/data/work'

export default function WorkSection({ header }: { header?: ReactNode }) {
  return (
    <section
      id="work"
      className="mx-auto max-w-[1600px] scroll-mt-[71px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36"
    >
      {header ?? (
        <ScrollReveal as="header" className="pb-12 lg:pb-20">
          <SectionHeading>Recent work</SectionHeading>
        </ScrollReveal>
      )}

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {clientWork.map((project) => (
          <FeaturedProject key={project.title} project={project} />
        ))}
      </div>

      <div className="mt-16 pt-8 lg:mt-24 lg:pt-12">
        <ScrollReveal className="mb-10 flex items-end justify-between gap-6">
          <div>
            <SectionHeading>Side projects</SectionHeading>
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
