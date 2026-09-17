import type { ReactNode } from 'react'
import { FeaturedProject } from '~/components/home/ProjectCards'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import { recentWork } from '~/data/work'

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
        {recentWork.map((project) => (
          <FeaturedProject key={project.title} project={project} />
        ))}
      </div>
    </section>
  )
}
