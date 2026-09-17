import { createFileRoute } from '@tanstack/react-router'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
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
            className="border-foreground/20 mb-12 grid gap-7 border-b pb-12 lg:mb-20 lg:grid-cols-[1fr_1fr] lg:items-end lg:pb-20"
          >
            <div>
              <PageHeading>
                Built for the
                <br />
                <em className="text-brand">real world.</em>
              </PageHeading>
            </div>
            <p className="text-foreground/55 max-w-xl text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
              Product experiences where visual ambition and engineering rigor
              have to coexist. I care about the concept, the system, and the
              final 2px in production.
            </p>
          </ScrollReveal>
        }
      />
    </Main>
  )
}
