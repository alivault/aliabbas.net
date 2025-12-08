import { createFileRoute } from '@tanstack/react-router'
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
  return (
    <Main>
      <Nav />
      <Section>
        <PageHeading>Experience</PageHeading>
        <ExperienceList />
      </Section>
    </Main>
  )
}

