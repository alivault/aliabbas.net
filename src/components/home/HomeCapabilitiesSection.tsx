import ScrollReveal from '~/components/ScrollReveal'
import { capabilities } from '~/data/capabilities'

export default function HomeCapabilitiesSection() {
  return (
    <section className="bg-background text-foreground">
      <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
        <ScrollReveal as="header">
          <h2 className="font-display text-5xl tracking-[-0.045em] sm:text-7xl">
            Skillset
          </h2>
        </ScrollReveal>

        <div className="border-foreground/15 mt-20 border-t lg:mt-28">
          {capabilities.map((capability, index) => (
            <ScrollReveal
              key={capability.number}
              as="article"
              delay={index * 0.04}
              className="border-foreground/15 grid gap-4 border-b py-7 sm:grid-cols-2 sm:items-center sm:py-9"
            >
              <h3 className="font-display text-4xl tracking-[-0.035em] sm:text-5xl">
                {capability.title}
              </h3>
              <p className="text-foreground/45 max-w-xl text-sm leading-6 sm:justify-self-end">
                {capability.description}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
