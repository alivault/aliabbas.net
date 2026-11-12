import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'
import { Braces, Cloud, Database, Layers3 } from 'lucide-react'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import SkillList from '~/components/skills/SkillList'
import StackMarquee from '~/components/skills/StackMarquee'
import Title from '~/components/Title'

const architecture = [
  {
    icon: Layers3,
    label: 'Interface',
    value: 'React · TanStack · Motion',
  },
  {
    icon: Braces,
    label: 'Application',
    value: 'TypeScript · Query · Forms',
  },
  {
    icon: Database,
    label: 'Data & identity',
    value: 'Convex · Sanity · Better Auth',
  },
  {
    icon: Cloud,
    label: 'Delivery',
    value: 'Cloudflare · Vite+',
  },
] as const

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

          <ScrollReveal className="mt-section-content grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="lg:py-2">
              <Title as="h2" variant="subsection" className="max-w-sm">
                This site is a production system
              </Title>
              <p className="text-fg-muted mt-4 max-w-md text-sm leading-6">
                Not a static mockup: server rendering, managed content,
                authentication, realtime comments, transactional email, and edge
                deployment.
              </p>
            </div>
            <ul className="border-foreground/15 bg-foreground/15 grid gap-px overflow-hidden rounded-[2px] border sm:grid-cols-2">
              {architecture.map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="bg-background group hover:bg-foreground/[0.03] flex flex-col gap-6 p-6 transition-colors sm:gap-10 sm:p-7"
                >
                  <Icon
                    className="text-fg-muted group-hover:text-foreground size-5 transition-colors"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-fg-muted mt-1.5 text-sm">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>
    </Main>
  )
}
