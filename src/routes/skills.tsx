import { createFileRoute } from '@tanstack/react-router'
import { Braces, Cloud, Database, Layers3 } from 'lucide-react'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { capabilities } from '~/data/capabilities'

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
  head: () => ({
    meta: [
      { title: 'Skills — Ali Abbas' },
      {
        name: 'description',
        content:
          'Streaming state, motion and interaction, design systems, and performance and accessibility.',
      },
    ],
  }),
  component: SkillsPage,
})

function SkillsPage() {
  return (
    <Main>
      <section className="bg-background text-foreground">
        <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <ScrollReveal
            as="header"
            className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
          >
            <div>
              <PageHeading>
                Ideas,
                <br />
                <span className="text-brand">engineered.</span>
              </PageHeading>
            </div>
            <p className="text-foreground/55 max-w-lg text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
              I bridge product design and frontend engineering, so the idea
              survives implementation—and the interface holds up in every state
              after launch.
            </p>
          </ScrollReveal>

          <div className="border-foreground/15 mt-section-content border-t">
            {capabilities.map((capability, index) => (
              <ScrollReveal
                key={capability.number}
                as="article"
                delay={index * 0.04}
                className="group border-foreground/15 hover:text-brand grid gap-4 border-b py-7 transition-colors sm:grid-cols-2 sm:items-center sm:py-9"
              >
                <Title as="h2" variant="card">
                  {capability.title}
                </Title>
                <p className="text-foreground/45 max-w-xl text-sm leading-6 sm:justify-self-end">
                  {capability.description}
                </p>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-section-content grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="lg:py-2">
              <Title as="h2" variant="subsection" className="max-w-sm">
                This site is a production system
              </Title>
              <p className="text-foreground/45 mt-4 max-w-md text-sm leading-6">
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
                    className="text-foreground/50 group-hover:text-foreground size-5 transition-colors"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-foreground/55 mt-1.5 text-sm">{value}</p>
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
