import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getExperiences } from '~/lib/sanity'
import ExperienceList from '~/components/ExperienceList'
import Main from '~/components/Main'
import Nav from '~/components/Nav'
import PageHeading from '~/components/PageHeading'
import Section from '~/components/Section'

export const Route = createFileRoute('/experience')({
  head: () => ({
    meta: [
      { title: 'Experience | Ali Abbas' },
      { name: 'description', content: 'My work experience.' },
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
      <Nav />
      <Section>
        <PageHeading>Experience</PageHeading>
        {isLoading ? (
          <p className="prose dark:prose-invert opacity-60">Loading experience...</p>
        ) : experiences.length === 0 ? (
          <p className="prose dark:prose-invert">No experience yet.</p>
        ) : (
          <ExperienceList experiences={experiences} />
        )}
      </Section>
    </Main>
  )
}
