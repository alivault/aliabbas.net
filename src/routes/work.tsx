import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import SideProjects from '~/components/SideProjects'
import WorkSection from '~/components/WorkSection'

export const Route = createFileRoute('/work')({
  head: () =>
    pageHead({
      title: 'Selected Work — Ali Abbas',
      description: 'Selected products designed and engineered by Ali Abbas.',
      path: '/work',
    }),
  component: WorkPage,
})

function WorkPage() {
  return (
    <Main>
      <WorkSection
        header={
          <ScrollReveal
            as="header"
            className="border-foreground/20 mb-section-divider pb-section-divider grid justify-items-center gap-6 border-b text-center"
          >
            <div>
              <PageHeading>Built for the real world.</PageHeading>
            </div>
            <p className="text-fg-muted max-w-xl text-base leading-7 text-pretty lg:text-lg lg:leading-8">
              Product experiences where visual ambition and engineering rigor
              have to coexist. I care about the concept, the system, and the
              final 2px in production.
            </p>
          </ScrollReveal>
        }
      />
      <SideProjects />
    </Main>
  )
}
