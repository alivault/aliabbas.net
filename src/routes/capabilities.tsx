import { createFileRoute } from '@tanstack/react-router'
import { Braces, Cloud, Database, Layers3 } from 'lucide-react'
import { motion } from 'motion/react'
import Main from '~/components/Main'
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

export const Route = createFileRoute('/capabilities')({
  head: () => ({
    meta: [
      { title: 'Capabilities — Ali Abbas' },
      {
        name: 'description',
        content:
          'Product thinking, frontend systems, application engineering, and creative direction.',
      },
    ],
  }),
  component: CapabilitiesPage,
})

function CapabilitiesPage() {
  return (
    <Main>
      <section className="bg-[#10100f] text-[#f1efe8]">
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
          <header className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#d9ff43] uppercase">
                One brain, both sides of the build
              </p>
              <h1 className="mt-5 text-[clamp(3.1rem,9vw,8.5rem)] leading-[0.76] font-extrabold tracking-[-0.07em] uppercase">
                Beautiful
                <br />
                <span className="font-display font-normal text-[#d9ff43] normal-case italic">
                  on the surface.
                </span>
                <br />
                Serious
                <br />
                underneath.
              </h1>
            </div>
            <p className="max-w-lg text-base leading-7 text-white/55 lg:justify-self-end lg:text-lg lg:leading-8">
              I bridge product design and full-stack engineering, so the idea
              survives implementation—and the implementation holds up after
              launch.
            </p>
          </header>

          <div className="mt-20 border-t border-white/15 lg:mt-28">
            {capabilities.map((capability) => (
              <motion.article
                key={capability.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group grid gap-4 border-b border-white/15 py-7 transition-colors hover:text-[#d9ff43] sm:grid-cols-[80px_1fr_1fr] sm:items-center sm:py-9"
              >
                <span className="font-mono text-[10px] text-white/30">
                  {capability.number}
                </span>
                <h2 className="font-display text-4xl tracking-[-0.035em] sm:text-5xl">
                  {capability.title}
                </h2>
                <p className="max-w-xl text-sm leading-6 text-white/45 transition-colors group-hover:text-[#d9ff43]/60 sm:justify-self-end">
                  {capability.description}
                </p>
              </motion.article>
            ))}
          </div>

          <div className="mt-20 rounded-[2px] border border-white/15 bg-white/[0.03] p-5 sm:p-8 lg:mt-28 lg:p-10">
            <div className="flex flex-col justify-between gap-5 border-b border-white/15 pb-7 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold">
                  <span className="size-2 rounded-full bg-[#d9ff43] shadow-[0_0_12px_#d9ff43]" />
                  This portfolio is a live full-stack system
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                  Not a static mockup: server rendering, managed content,
                  authentication, realtime comments, transactional email, and
                  edge deployment.
                </p>
              </div>
              <span className="font-mono text-[9px] tracking-[0.18em] text-white/25 uppercase">
                Production architecture
              </span>
            </div>
            <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {architecture.map(({ icon: Icon, label, value }) => (
                <div key={label} className="py-7 sm:px-7 lg:py-8">
                  <Icon className="size-5 text-[#d9ff43]" strokeWidth={1.5} />
                  <p className="mt-8 text-xs font-bold">{label}</p>
                  <p className="mt-2 text-[11px] text-white/35">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Main>
  )
}
