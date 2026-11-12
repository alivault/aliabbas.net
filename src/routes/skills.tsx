import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import SkillList from '~/components/skills/SkillList'
import StackMarquee from '~/components/skills/StackMarquee'

export const Route = createFileRoute('/skills')({
  head: () =>
    pageHead({
      title: 'Skills — Ali Abbas',
      description:
        'Streaming state, motion and interaction, design systems, and performance and accessibility.',
      path: '/skills',
    }),
  component: SkillsPage,
})

function SkillsPage() {
  return (
    <Main>
      <section className="bg-background text-foreground">
        <div className="pt-section pb-section-content mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <ScrollReveal
            as="header"
            className="grid justify-items-center gap-6 text-center"
          >
            <div>
              <PageHeading>Ideas, engineered.</PageHeading>
            </div>
            <p className="text-fg-muted max-w-xl text-base leading-7 text-pretty lg:text-lg lg:leading-8">
              I bridge product design and frontend engineering, so the idea
              survives implementation—and the interface holds up in every state
              after launch.
            </p>
          </ScrollReveal>
        </div>

        {/* Full width, outside the page margins. */}
        <ScrollReveal amount={0.4}>
          <StackMarquee />
        </ScrollReveal>

        <div className="pb-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <div className="mt-section-content">
            <SkillList headingLevel="h2" />
          </div>
        </div>
      </section>
    </Main>
  )
}
