import { createFileRoute } from '@tanstack/react-router'
import { Braces, Cloud, Database, Layers3 } from 'lucide-react'
import Main from '~/components/Main'
import ScrollReveal from '~/components/ScrollReveal'
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

export const Route = createFileRoute('/skillset')({
  head: () => ({
    meta: [
      { title: 'Skillset — Ali Abbas' },
      {
        name: 'description',
        content:
          'Product thinking, frontend systems, application engineering, and creative direction.',
      },
    ],
  }),
  component: SkillsetPage,
})

function SkillsetPage() {
  return (
    <Main>
      <section className="bg-background text-foreground">
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <ScrollReveal
            as="header"
            className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
          >
            <div>
              <h1 className="text-[clamp(3.1rem,9vw,8.5rem)] leading-[0.76] font-extrabold tracking-[-0.07em]">
                Ideas,
                <br />
                <span className="font-display text-brand font-normal normal-case italic">
                  engineered.
                </span>
              </h1>
            </div>
            <p className="text-foreground/55 max-w-lg text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
              I bridge product design and full-stack engineering, so the idea
              survives implementation—and the implementation holds up after
              launch.
            </p>
          </ScrollReveal>

          <div className="border-foreground/15 mt-20 border-t lg:mt-28">
            {capabilities.map((capability, index) => (
              <ScrollReveal
                key={capability.number}
                as="article"
                delay={index * 0.04}
                className="group border-foreground/15 hover:text-brand grid gap-4 border-b py-7 transition-colors sm:grid-cols-2 sm:items-center sm:py-9"
              >
                <h2 className="font-display text-4xl tracking-[-0.035em] sm:text-5xl">
                  {capability.title}
                </h2>
                <p className="text-foreground/45 group-hover:text-brand/60 max-w-xl text-sm leading-6 transition-colors sm:justify-self-end">
                  {capability.description}
                </p>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="border-foreground/15 bg-foreground/[0.03] mt-20 rounded-[2px] border p-5 sm:p-8 lg:mt-28 lg:p-10">
            <div className="border-foreground/15 flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold">
                  <span className="bg-brand size-2 rounded-full shadow-[0_0_12px_var(--brand)]" />
                  This portfolio is a live full-stack system
                </p>
                <p className="text-foreground/40 mt-2 max-w-xl text-sm leading-6">
                  Not a static mockup: server rendering, managed content,
                  authentication, realtime comments, transactional email, and
                  edge deployment.
                </p>
              </div>
              <span className="text-foreground/25 font-mono text-[9px] tracking-[0.18em] uppercase">
                Production architecture
              </span>
            </div>
            <div className="divide-foreground/10 grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {architecture.map(({ icon: Icon, label, value }) => (
                <div key={label} className="py-7 sm:px-7 lg:py-8">
                  <Icon className="text-brand size-5" strokeWidth={1.5} />
                  <p className="mt-8 text-xs font-bold">{label}</p>
                  <p className="text-foreground/35 mt-2 text-[11px]">{value}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Main>
  )
}
