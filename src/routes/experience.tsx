import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import ExperienceList from '~/components/ExperienceList'
import Main from '~/components/Main'
import ScrollReveal from '~/components/ScrollReveal'
import Section from '~/components/Section'
import { getExperiences } from '~/lib/sanity'

export const Route = createFileRoute('/experience')({
  head: () => ({
    meta: [
      { title: 'Experience — Ali Abbas' },
      {
        name: 'description',
        content:
          'Product engineering and creative frontend experience across ambitious digital products.',
      },
    ],
  }),
  component: ExperiencePage,
})

function ExperiencePage() {
  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: getExperiences,
  })

  return (
    <Main>
      <Section>
        <ScrollReveal
          as="header"
          className="grid gap-8 border-b border-black/20 pb-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:pb-16"
        >
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#335cff] uppercase">
              Career / teams / products
            </p>
            <h1 className="font-display mt-5 text-[clamp(3.5rem,10vw,9rem)] leading-[0.74] tracking-[-0.065em]">
              Work that
              <br />
              <em className="text-[#335cff]">shaped me.</em>
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-black/55 lg:justify-self-end lg:text-lg lg:leading-8">
            A path through product teams, creative development, frontend
            systems, and the problems that taught me how to ship better work.
          </p>
        </ScrollReveal>

        {isLoading ? (
          <div className="divide-y divide-black/15">
            {[0, 1].map((item) => (
              <div key={item} className="h-52 animate-pulse bg-black/[0.025]" />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <p className="py-16 text-sm text-black/45">No experience yet.</p>
        ) : (
          <ExperienceList experiences={experiences} />
        )}
      </Section>
    </Main>
  )
}
