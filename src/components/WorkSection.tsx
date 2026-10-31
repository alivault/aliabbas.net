import type { ReactNode } from 'react'
import { FeaturedProject } from '~/components/home/ProjectCards'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import { recentWork } from '~/data/work'

export default function WorkSection({ header }: { header?: ReactNode }) {
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

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {recentWork.map((project) => (
          <FeaturedProject key={project.title} project={project} />
        ))}
      </div>
    </section>
  )
}
