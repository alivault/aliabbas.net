import { createFileRoute } from '@tanstack/react-router'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import SideProjects from '~/components/SideProjects'
import WorkSection from '~/components/WorkSection'

export const Route = createFileRoute('/work')({
  head: () => ({
    meta: [
      { title: 'Selected Work — Ali Abbas' },
      {
        name: 'description',
        content: 'Selected products designed and engineered by Ali Abbas.',
      },
    ],
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
            className="border-foreground/20 mb-section-divider pb-section-divider grid gap-7 border-b lg:grid-cols-[1fr_1fr] lg:items-end"
          >
            <div>
              <PageHeading>
                Built for the
                <br />
                <em className="text-fg-muted">real world.</em>
              </PageHeading>
            </div>
            <p className="text-fg-muted max-w-xl text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
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
