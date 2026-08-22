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
          className="border-foreground/20 grid gap-8 border-b pb-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:pb-16"
        >
          <div>
            <h1 className="font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.74] tracking-[-0.065em]">
              Work that
              <br />
              <em className="text-brand">shaped me.</em>
            </h1>
          </div>
          <p className="text-foreground/55 max-w-xl text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
            A path through product teams, creative development, frontend
            systems, and the problems that taught me how to ship better work.
          </p>
        </ScrollReveal>

        {isLoading ? (
          <div className="divide-foreground/15 divide-y">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="bg-foreground/[0.025] h-52 animate-pulse"
              />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <p className="text-foreground/45 py-16 text-sm">No experience yet.</p>
        ) : (
          <ExperienceList experiences={experiences} />
        )}
      </Section>
    </Main>
  )
}
